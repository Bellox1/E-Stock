<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Announcement;
use Illuminate\Http\Request;
use Carbon\Carbon;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $shopIds = $user->shops()->pluck('id');
        $notifications = [];

        // 1. Produits en alerte de stock
        $lowStockProducts = Product::whereIn('shop_id', $shopIds)
            ->whereColumn('stock_quantity', '<=', 'stock_threshold')
            ->get();

        foreach ($lowStockProducts as $product) {
            $notifications[] = [
                'id' => 'stock_' . $product->id,
                'title' => 'Alerte Stock : ' . $product->name,
                'content' => "Il ne reste que $product->stock_quantity unité(s) en stock. Seuil d'alerte : $product->stock_threshold.",
                'created_at' => $product->updated_at,
                'is_read' => false,
                'type' => 'warning',
                'meta' => ['product_id' => $product->id]
            ];
        }

        // 2. Clients avec dettes (paiements en retard)
        if ($user->hasPermission('alerts')) {
            $lateOrders = Order::whereIn('shop_id', $shopIds)
                ->where('status', '!=', 'paid')
                ->where('payment_due_date', '<', Carbon::now())
                ->with('client')
                ->get();

            foreach ($lateOrders as $order) {
                $debt = $order->total_amount - $order->paid_amount;
                $clientName = $order->client ? $order->client->name : 'Client inconnu';
                $notifications[] = [
                    'id' => 'debt_' . $order->id,
                    'title' => 'Dette en retard : ' . $clientName,
                    'content' => "Paiement de " . number_format($debt, 0, ',', ' ') . " F attendu depuis le " . Carbon::parse($order->payment_due_date)->format('d/m/Y') . ".",
                    'created_at' => $order->updated_at,
                    'is_read' => false,
                    'type' => 'error',
                    'meta' => ['order_id' => $order->id, 'client_id' => $order->client_id]
                ];
            }
        }

        // 3. Pubs du mois (Annonces actives des 30 derniers jours)
        $announcements = Announcement::where('is_active', true)
            ->where('created_at', '>=', Carbon::now()->subDays(30))
            ->orderBy('created_at', 'desc')
            ->get();

        foreach ($announcements as $ann) {
            $notifications[] = [
                'id' => 'ann_' . $ann->id,
                'title' => $ann->title,
                'content' => $ann->content,
                'created_at' => $ann->created_at,
                'is_read' => true, // Les annonces sont souvent considérées comme lues par défaut ou informatives
                'type' => 'info',
                'meta' => ['announcement_id' => $ann->id]
            ];
        }

        // Trier par date décroissante
        usort($notifications, function ($a, $b) {
            return Carbon::parse($b['created_at'])->timestamp - Carbon::parse($a['created_at'])->timestamp;
        });

        return response()->json($notifications);
    }
}
