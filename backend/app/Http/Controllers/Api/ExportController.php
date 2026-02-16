<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Shop;
use App\Models\Product;
use App\Models\Order;
use Illuminate\Support\Facades\Response;

class ExportController extends Controller
{
    private function checkPermission($user)
    {
         if (!$user->hasPermission('export_excel')) {
            abort(403, 'Votre offre ne permet pas l\'export Excel.');
        }
    }

    public function exportProducts(Request $request)
    {
        $user = $request->user();
        // Permission check disabled temporarily if 'export_excel' key doesn't exist yet for user
        // But assumed to be handled by hasPermission logic (returns false if missing)
        if (!$user->hasPermission('export_excel')) {
             return response()->json(['message' => 'Votre offre ne permet pas l\'export Excel. Veuillez passer à une offre supérieure.'], 403);
        }
        
        $request->validate(['shop_id' => 'required|exists:shops,id']);
        $shop = Shop::findOrFail($request->shop_id);

        if ($shop->user_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="produits_' . $shop->id . '_' . date('Y-m-d') . '.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function() use ($shop) {
            $file = fopen('php://output', 'w');
            
            // BOM for Excel to read UTF-8 correctly
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            fputcsv($file, ['N°', 'Nom', 'Categorie', 'Prix', 'Stock', 'Seuil Alerte', 'Description']);

            $products = $shop->products()->with('category')->get();
            $count = 1;

            foreach ($products as $product) {
                fputcsv($file, [
                    $count++,
                    $product->name,
                    $product->category ? $product->category->name : 'Aucune',
                    $product->price,
                    $product->stock_quantity,
                    $product->stock_threshold,
                    $product->description
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function exportOrders(Request $request)
    {
        $user = $request->user();
        if (!$user->hasPermission('export_excel')) {
             return response()->json(['message' => 'Votre offre ne permet pas l\'export Excel.'], 403);
        }

        $request->validate(['shop_id' => 'required|exists:shops,id']);
        $shop = Shop::findOrFail($request->shop_id);

        if ($shop->user_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="ventes_' . $shop->id . '_' . date('Y-m-d') . '.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function() use ($shop) {
            $file = fopen('php://output', 'w');
            
            // BOM for Excel
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($file, ['N°', 'Date Vente', 'Client', 'Total', 'Paye', 'Reste', 'Statut', 'Date Reglement', 'Echeance', 'Notes']);

            $orders = $shop->orders()->with('client')->latest()->get();
            $count = 1;

            foreach ($orders as $order) {
                $statusMap = [
                    'paid' => 'Paye',
                    'partial' => 'Partiel',
                    'credit' => 'Credit'
                ];

                fputcsv($file, [
                    $count++,

                    $order->created_at->format('Y-m-d H:i'),
                    $order->client ? $order->client->name : 'Anonyme',
                    $order->total_amount,
                    $order->paid_amount,
                    $order->total_amount - $order->paid_amount,
                    $statusMap[$order->status] ?? $order->status,
                    $order->payment_date ? date('Y-m-d', strtotime($order->payment_date)) : '-',
                    $order->payment_due_date ? date('Y-m-d', strtotime($order->payment_due_date)) : '-',
                    $order->debt_notes ?? ''
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
