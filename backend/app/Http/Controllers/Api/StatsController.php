<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Shop;
use App\Models\User;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    /**
     * Statistiques pour un commerçant (via ses boutiques)
     */
    public function merchantStats(Request $request)
    {
        $user = $request->user();
        $hasStatsPermission = $user->hasPermission('stats');

        $shopIds = $user->shops()->pluck('id');

        // Si un shop_id est fourni, filtrer uniquement pour cette boutique
        $shopId = $request->query('shop_id');
        if ($shopId && $shopIds->contains($shopId)) {
            $shopIds = collect([$shopId]);
        }

        // Filtrage par période (day, week, month, last_month, custom, all)
        $period = $request->query('period', 'month'); // Par défaut: Mois en cours
        
        // Sécurité: Si pas de permission stats, forcer la période à 'week' ou 'day'
        if (!$hasStatsPermission && in_array($period, ['month', 'last_month', 'custom'])) {
            $period = 'week';
        }

        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        // Définir les dates selon la période
        $isAllTime = ($period === 'all');
        if ($isAllTime) {
            $dateFrom = \Carbon\Carbon::parse('2020-01-01'); // Date de début arbitraire
            $dateTo = now()->endOfDay();
        } elseif ($period === 'custom' && $startDate && $endDate && $hasStatsPermission) {
            $dateFrom = \Carbon\Carbon::parse($startDate)->startOfDay();
            $dateTo = \Carbon\Carbon::parse($endDate)->endOfDay();
        } else {
            switch ($period) {
                case 'day':
                    $dateFrom = now()->startOfDay();
                    $dateTo = now()->endOfDay();
                    break;
                case 'month':
                    $dateFrom = now()->startOfMonth();
                    $dateTo = now()->endOfMonth();
                    break;
                case 'last_month':
                    $dateFrom = now()->subMonth()->startOfMonth();
                    $dateTo = now()->subMonth()->endOfMonth();
                    break;
                case 'week':
                default:
                    $dateFrom = now()->subDays(6)->startOfDay();
                    $dateTo = now()->endOfDay();
                    break;
            }
        }

        // Requête de base pour les commandes
        $ordersQuery = Order::whereIn('shop_id', $shopIds);
        if (!$isAllTime) {
            $ordersQuery->where('created_at', '>=', $dateFrom)
                        ->where('created_at', '<=', $dateTo);
        }

        // Statistiques de base
        $totalRevenue = (clone $ordersQuery)->sum('total_amount');
        $totalPaid = (clone $ordersQuery)->sum('paid_amount');
        $totalCredit = $totalRevenue - $totalPaid;

        // Nombre de clients ayant passé commande sur la période
        $clientsQuery = \App\Models\Client::whereHas('orders', function($q) use ($shopIds, $isAllTime, $dateFrom, $dateTo) {
            $q->whereIn('shop_id', $shopIds);
            if (!$isAllTime) {
                $q->where('created_at', '>=', $dateFrom)
                  ->where('created_at', '<=', $dateTo);
            }
        });
        $totalClients = $clientsQuery->count();

        // Nombre total de commandes
        $totalOrders = (clone $ordersQuery)->count();

        // Top 5 clients ayant passé le plus de commandes
        $topClients = \App\Models\Client::whereHas('orders', function($q) use ($shopIds, $isAllTime, $dateFrom, $dateTo) {
            $q->whereIn('shop_id', $shopIds);
            if (!$isAllTime) {
                $q->where('created_at', '>=', $dateFrom)
                  ->where('created_at', '<=', $dateTo);
            }
        })
        ->withCount(['orders' => function($q) use ($shopIds, $isAllTime, $dateFrom, $dateTo) {
            $q->whereIn('shop_id', $shopIds);
            if (!$isAllTime) {
                $q->where('created_at', '>=', $dateFrom)
                  ->where('created_at', '<=', $dateTo);
            }
        }])
        ->withSum(['orders' => function($q) use ($shopIds, $isAllTime, $dateFrom, $dateTo) {
            $q->whereIn('shop_id', $shopIds);
            if (!$isAllTime) {
                $q->where('created_at', '>=', $dateFrom)
                  ->where('created_at', '<=', $dateTo);
            }
        }], 'total_amount')
        ->orderBy('orders_count', 'desc')
        ->limit(5)
        ->get();

        // Top 5 commandes avec le prix le plus élevé
        $topOrders = (clone $ordersQuery)
            ->with(['client', 'shop'])
            ->orderBy('total_amount', 'desc')
            ->limit(5)
            ->get();

        $lowStockProductsItems = Product::whereIn('shop_id', $shopIds)
            ->whereColumn('stock_quantity', '<=', 'stock_threshold')
            ->with('category')
            ->limit(5)
            ->get();
        
        $lowStockProductsCount = Product::whereIn('shop_id', $shopIds)
            ->whereColumn('stock_quantity', '<=', 'stock_threshold')
            ->count();

        // Valeur totale du stock (Prix x Quantité) - Chiffre d'affaires potentiel
        $inventoryValue = Product::whereIn('shop_id', $shopIds)
            ->select(DB::raw('SUM(price * stock_quantity) as total'))
            ->first()->total ?? 0;

        // Breakdown par boutique
        $shopsInventory = [];
        if ($shopIds->count() > 1) {
            $shopsInventory = Product::whereIn('shop_id', $shopIds)
                ->select('shop_id', DB::raw('SUM(price * stock_quantity) as inventory_value'))
                ->groupBy('shop_id')
                ->get()
                ->map(function($item) {
                    $shop = \App\Models\Shop::find($item->shop_id);
                    return [
                        'shop_id' => $item->shop_id,
                        'shop_name' => $shop ? $shop->name : 'Inconnue',
                        'inventory_value' => (float)$item->inventory_value
                    ];
                });
        }

        // Calculer le nombre d'alertes urgentes (Paiements en retard ou imminents < 3 jours)
        $urgentPaymentsCount = Order::whereIn('shop_id', $shopIds)
            ->whereIn('status', ['credit', 'partial'])
            ->where(function($q) {
                $q->whereNull('payment_due_date')
                  ->orWhere('payment_due_date', '<=', now()->addDays(3));
            })
            ->count();

        // Données pour le graphique
        $isSqlite = DB::connection()->getDriverName() === 'sqlite';
        if ($isAllTime) {
            $dateFormat = $isSqlite ? "strftime('%Y-%m-01', created_at)" : "DATE_FORMAT(created_at, '%Y-%m-01')";
            $chartData = (clone $ordersQuery)
                ->select(DB::raw($dateFormat . " as date"), DB::raw('SUM(total_amount) as total'))
                ->groupBy('date')
                ->orderBy('date')
                ->get();
        } else {
            $chartData = (clone $ordersQuery)
                ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total_amount) as total'))
                ->groupBy('date')
                ->orderBy('date')
                ->get();
        }

        return response()->json([
            'revenue' => $hasStatsPermission ? (float)$totalRevenue : 0,
            'paid' => $hasStatsPermission ? (float)$totalPaid : 0,
            'credit' => $hasStatsPermission ? (float)$totalCredit : 0,
            'total_clients' => $hasStatsPermission ? $totalClients : 0,
            'total_orders' => $hasStatsPermission ? $totalOrders : 0,
            'top_clients' => $hasStatsPermission ? $topClients : [],
            'top_orders' => $hasStatsPermission ? $topOrders : [],
            'low_stock_count' => $lowStockProductsCount,
            'low_stock_products' => $lowStockProductsItems,
            'inventory_value' => (float)$inventoryValue,
            'shops_inventory' => $shopsInventory,
            'late_payments_count' => $urgentPaymentsCount,
            'shops_count' => $shopIds->count(),
            'chart_data' => $hasStatsPermission ? $chartData : [],
            'unread_notifications_count' => $lowStockProductsCount + $urgentPaymentsCount,
            'shop_filter' => $shopId ? 'single' : 'all',
            'period' => $period,
            'date_from' => $dateFrom->toDateString(),
            'date_to' => $dateTo->toDateString()
        ]);
    }

    /**
     * Statistiques globales (Admin uniquement)
     */
    public function adminStats()
    {
        $totalShops = Shop::count();
        $totalUsersCount = User::where('is_admin', false)->count();
        $totalOrdersCount = Order::count();
        $totalProductsCount = Product::count(); // Nouveau: Total des produits
        $totalClientsCount = \App\Models\Client::count(); // Nouveau: Total des clients
        $totalPlatformEarnings = Subscription::where('status', 'active')->sum('paid_price');
        $activeSubscriptionsCount = Subscription::where('status', 'active')->count();

        // Offres les plus vendues et revenus par offre
        $offersStats = \App\Models\Offer::withCount(['subscriptions as total_sales'])
            ->withSum('subscriptions as total_revenue', 'paid_price')
            ->get(['id', 'name'])
            ->map(function($offer) {
                return [
                    'name' => $offer->name,
                    'sales' => $offer->total_sales ?? 0,
                    'revenue' => (float)($offer->total_revenue ?? 0)
                ];
            });

        // Marchands avec vs sans abonnement
        $subscribersCount = User::where('is_admin', false)
            ->whereHas('subscriptions', function($q) {
                $q->where('status', 'active')
                  ->where('ends_at', '>', now());
            })->count();

        $nonSubscribersCount = $totalUsersCount - $subscribersCount;

        return response()->json([
            'total_shops' => $totalShops,
            'total_merchants' => $totalUsersCount,
            'total_orders' => $totalOrdersCount,
            'total_products' => $totalProductsCount, // Ajouté
            'total_clients' => $totalClientsCount,   // Ajouté
            'total_subscriptions_earnings' => $totalPlatformEarnings,
            'active_subscriptions' => $activeSubscriptionsCount,
            'offers_performance' => $offersStats,
            'subscription_distribution' => [
                ['label' => 'Abonnés', 'count' => $subscribersCount, 'color' => '#10B981'],
                ['label' => 'Non Abonnés', 'count' => $nonSubscribersCount, 'color' => '#6B7280']
            ]
        ]);
    }
}
