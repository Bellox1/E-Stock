<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Shop;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class OrderController extends Controller
{
    /**
     * Liste des ventes d'une boutique
     */
    public function index(Request $request)
    {
        $request->validate(['shop_id' => 'required|exists:shops,id']);
        $shop = Shop::findOrFail($request->shop_id);

        if ($shop->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $orders = $shop->orders()->with(['client', 'items.product'])->latest()->get();
        return response()->json($orders);
    }

    /**
     * Enregistrer une vente
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'shop_id' => 'required|exists:shops,id',
            'client_id' => 'nullable|exists:clients,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'paid_amount' => 'required|numeric|min:0',
            'payment_due_date' => 'nullable|date',
            'debt_notes' => 'nullable|string',
        ]);

        $shop = Shop::findOrFail($validated['shop_id']);
        if ($shop->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        return DB::transaction(function () use ($validated, $shop) {
            $totalAmount = 0;
            $orderItemsData = [];

            foreach ($validated['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);
                
                if ($product->stock_quantity < $item['quantity']) {
                    throw new \Exception("Stock insuffisant pour le produit: {$product->name}");
                }

                $price = $product->price;
                $totalAmount += $price * $item['quantity'];

                $orderItemsData[] = [
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $price,
                ];

                // Mettre à jour le stock
                $product->decrement('stock_quantity', $item['quantity']);
            }

            // Validation : le montant payé ne peut pas dépasser le total
            if ($validated['paid_amount'] > $totalAmount) {
                throw new \Exception("Le montant payé ({$validated['paid_amount']} F) ne peut pas dépasser le total de la commande ({$totalAmount} F)");
            }

            $status = 'paid';
            if ($validated['paid_amount'] == 0) {
                $status = 'credit';
            } elseif ($validated['paid_amount'] < $totalAmount) {
                $status = 'partial';
            }

            // Définir la date de règlement si un montant a été payé (même partiellement)
            $paymentDate = ($validated['paid_amount'] > 0) ? now()->format('Y-m-d') : null;

            $order = $shop->orders()->create([
                'client_id' => $validated['client_id'] ?? null,
                'total_amount' => $totalAmount,
                'paid_amount' => $validated['paid_amount'],
                'status' => $status,
                'payment_due_date' => $validated['payment_due_date'] ?? null,
                'payment_date' => $paymentDate,
                'debt_notes' => $validated['debt_notes'] ?? null,
            ]);

            foreach ($orderItemsData as $itemData) {
                $order->items()->create($itemData);
            }

            return response()->json($order->load('items.product'), 201);
        });
    }

    /**
     * Voir une commande
     */
    public function show(Request $request, Order $order)
    {
        if ($order->shop->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }
        return response()->json($order->load(['client', 'items.product']));
    }

    /**
     * Mettre à jour un paiement
     */
    public function updatePayment(Request $request, Order $order)
    {
        if ($order->shop->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'added_amount' => 'required|numeric|min:0.01',
            'payment_due_date' => 'nullable|date',
            'debt_notes' => 'nullable|string',
        ]);

        $newPaidAmount = $order->paid_amount + $validated['added_amount'];
        
        if ($newPaidAmount > $order->total_amount) {
            return response()->json(['message' => 'Le montant payé ne peut pas dépasser le total'], 422);
        }

        $status = 'partial';
        if ($newPaidAmount == $order->total_amount) {
            $status = 'paid';
        }

        // Définir la date de règlement à aujourd'hui car un versement a été effectué
        $paymentDate = now()->format('Y-m-d');

        $updateData = [
            'paid_amount' => $newPaidAmount,
            'status' => $status,
            'payment_date' => $paymentDate,
        ];

        // Mettre à jour la date d'échéance et les notes si fournies
        if ($request->has('payment_due_date')) {
            $updateData['payment_due_date'] = $validated['payment_due_date'];
        }
        if ($request->has('debt_notes')) {
            $updateData['debt_notes'] = $validated['debt_notes'];
        }

        $order->update($updateData);

        return response()->json($order);
    }

    /**
     * Modifier une commande (produits et paiement)
     */
    public function update(Request $request, Order $order)
    {
        if ($order->shop->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'paid_amount' => 'required|numeric|min:0',
            'payment_due_date' => 'nullable|date',
            'debt_notes' => 'nullable|string',
        ]);
        
        return DB::transaction(function () use ($validated, $order) {
            // 1. Restaurer le stock des anciens produits
            foreach ($order->items as $oldItem) {
                $oldItem->product->increment('stock_quantity', $oldItem->quantity);
            }

            // 2. Supprimer les anciens items
            $order->items()->delete();

            // 3. Calculer le nouveau total et créer les nouveaux items
            $totalAmount = 0;
            $orderItemsData = [];

            foreach ($validated['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);
                
                if ($product->stock_quantity < $item['quantity']) {
                    throw new \Exception("Stock insuffisant pour le produit: {$product->name}");
                }

                $price = $product->price;
                $totalAmount += $price * $item['quantity'];

                $orderItemsData[] = [
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $price,
                ];

                // Déduire le nouveau stock
                $product->decrement('stock_quantity', $item['quantity']);
            }

            // Validation : le montant payé ne peut pas dépasser le total
            if ($validated['paid_amount'] > $totalAmount) {
                throw new \Exception("Le montant payé ({$validated['paid_amount']} F) ne peut pas dépasser le total de la commande ({$totalAmount} F)");
            }

            // 4. Déterminer le nouveau statut
            $status = 'paid';
            if ($validated['paid_amount'] == 0) {
                $status = 'credit';
            } elseif ($validated['paid_amount'] < $totalAmount) {
                $status = 'partial';
            }

            // Définir la date de règlement si un montant a été payé (même partiellement)
            $paymentDate = ($validated['paid_amount'] > 0) ? now()->format('Y-m-d') : null;

            // 5. Mettre à jour la commande
            $order->update([
                'total_amount' => $totalAmount,
                'paid_amount' => $validated['paid_amount'],
                'status' => $status,
                'payment_due_date' => $validated['payment_due_date'] ?? null,
                'payment_date' => $paymentDate,
                'debt_notes' => $validated['debt_notes'] ?? null,
            ]);

            // 6. Créer les nouveaux items
            foreach ($orderItemsData as $itemData) {
                $order->items()->create($itemData);
            }

            return response()->json($order->load('items.product'));
        });
    }

    /**
     * Télécharger la facture PDF d'une commande
     */
    public function downloadInvoice(Request $request, Order $order)
    {
        // Authentification manuelle car Sanctum peut être capricieux avec les téléchargements mobiles
        $user = $request->user();
        
        // Si pas d'utilisateur via Sanctum, on cherche via le paramètre 'token'
        if (!$user && $request->has('token')) {
            $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($request->token);
            if ($accessToken) {
                $user = $accessToken->tokenable;
            }
        }

        // Vérifier que l'utilisateur est authentifié et a accès à cette commande
        if (!$user || $order->shop->user_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        // Vérification des permissions de l'offre
        if (!$user->hasPermission('invoices')) {
            return response()->json([
                'message' => "Votre offre actuelle ne permet pas le téléchargement de factures PDF. Veuillez passer à une offre supérieure."
            ], 403);
        }

        // Charger les relations nécessaires
        $order->load(['client', 'items.product', 'shop']);

        // Préparer les images en Base64 pour une compatibilité maximale
        foreach ($order->items as $item) {
            if ($item->product && $item->product->image_url) {
                try {
                    $path = str_replace(url('/storage'), storage_path('app/public'), $item->product->image_url);
                    if (file_exists($path)) {
                        $type = pathinfo($path, PATHINFO_EXTENSION);
                        $data = file_get_contents($path);
                        $item->product->base64_image = 'data:image/' . $type . ';base64,' . base64_encode($data);
                    }
                } catch (\Exception $e) {
                    $item->product->base64_image = null;
                }
            }
        }

        // Générer le PDF
        $pdf = Pdf::loadView('invoice', [
            'order' => $order,
            'shop' => $order->shop,
        ]);

        // Nom du fichier
        $filename = 'facture_' . str_pad($order->id, 6, '0', STR_PAD_LEFT) . '.pdf';

        // Retourner le PDF en streaming avec les bons headers
        return $pdf->stream($filename, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"'
        ]);
    }
}
