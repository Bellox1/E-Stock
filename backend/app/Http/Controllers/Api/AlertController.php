<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AlertController extends Controller
{
    /**
     * Récupérer les alertes de paiement pour l'utilisateur
     */
    public function getPaymentAlerts(Request $request)
    {
        $user = $request->user();
        $hasAlertsPermission = $user->hasPermission('alerts');
        
        if (!$hasAlertsPermission) {
            return response()->json([
                'alerts' => [],
                'summary' => [
                    'total' => 0,
                    'critical' => 0,
                    'high' => 0,
                    'medium' => 0,
                    'low' => 0,
                ],
            ]);
        }
        
        // Récupérer toutes les boutiques de l'utilisateur
        $shopIds = $user->shops()->pluck('id');
        
        // Récupérer TOUTES les commandes non payées (avec ou sans échéance)
        $orders = \App\Models\Order::whereIn('shop_id', $shopIds)
            ->whereIn('status', ['credit', 'partial'])
            ->with(['client', 'shop'])
            ->orderBy('payment_due_date', 'asc')
            ->orderBy('created_at', 'desc')
            ->get();
        
        $alerts = [];
        $today = now()->startOfDay();
        
        foreach ($orders as $order) {
            $alert = [
                'id' => $order->id,
                'order_id' => $order->id,
                'shop_id' => $order->shop_id,
                'shop_name' => $order->shop->name,
                'client_name' => $order->client ? $order->client->name : 'Client anonyme',
                'client_phone' => $order->client ? $order->client->phone : null,
                'total_amount' => $order->total_amount,
                'paid_amount' => $order->paid_amount,
                'remaining_amount' => $order->total_amount - $order->paid_amount,
                'payment_due_date' => $order->payment_due_date,
                'debt_notes' => $order->debt_notes,
                'created_at' => $order->created_at,
            ];
            
            // Si pas de date d'échéance, c'est une alerte de niveau bas
            if (!$order->payment_due_date) {
                $alert['type'] = 'no_due_date';
                $alert['severity'] = 'low';
                $alert['message'] = "Paiement en attente (pas d'échéance définie)";
                $alert['days_until_due'] = null;
            } else {
                $dueDate = \Carbon\Carbon::parse($order->payment_due_date)->startOfDay();
                $daysUntilDue = $today->diffInDays($dueDate, false);
                $alert['days_until_due'] = $daysUntilDue;
                
                // Déterminer le niveau d'urgence
                if ($daysUntilDue < 0) {
                    // En retard - TOUJOURS afficher
                    $alert['type'] = 'overdue';
                    $alert['severity'] = 'critical';
                    $alert['message'] = "Paiement en retard de " . abs($daysUntilDue) . " jour(s)";
                } elseif ($daysUntilDue == 0) {
                    $alert['type'] = 'due_today';
                    $alert['severity'] = 'high';
                    $alert['message'] = "Paiement dû aujourd'hui";
                } elseif ($daysUntilDue == 1) {
                    $alert['type'] = 'due_tomorrow';
                    $alert['severity'] = 'high';
                    $alert['message'] = "Paiement dû demain";
                } elseif ($daysUntilDue <= 3) {
                    $alert['type'] = 'due_soon';
                    $alert['severity'] = 'medium';
                    $alert['message'] = "Paiement dû dans " . $daysUntilDue . " jour(s)";
                } elseif ($daysUntilDue <= 7) {
                    $alert['type'] = 'upcoming';
                    $alert['severity'] = 'low';
                    $alert['message'] = "Paiement dû dans " . $daysUntilDue . " jour(s)";
                } else {
                    // Plus de 7 jours - ne pas afficher
                    continue;
                }
            }
            
            $alerts[] = $alert;
        }
        
        // Compter les alertes par sévérité
        $summary = [
            'total' => count($alerts),
            'critical' => count(array_filter($alerts, fn($a) => $a['severity'] === 'critical')),
            'high' => count(array_filter($alerts, fn($a) => $a['severity'] === 'high')),
            'medium' => count(array_filter($alerts, fn($a) => $a['severity'] === 'medium')),
            'low' => count(array_filter($alerts, fn($a) => $a['severity'] === 'low')),
        ];
        
        return response()->json([
            'alerts' => $alerts,
            'summary' => $summary,
        ]);
    }
    
    /**
     * Récupérer les statistiques de dette
     */
    public function getDebtStats(Request $request)
    {
        $user = $request->user();

        if (!$user->hasPermission('alerts')) {
            return response()->json([
                'total_unpaid_orders' => 0,
                'total_debt' => 0,
                'overdue_debt' => 0,
                'overdue_count' => 0
            ]);
        }

        $shopIds = $user->shops()->pluck('id');
        
        $today = now()->format('Y-m-d');
        
        $stats = \App\Models\Order::whereIn('shop_id', $shopIds)
            ->whereIn('status', ['credit', 'partial'])
            ->selectRaw('
                COUNT(*) as total_unpaid_orders,
                SUM(total_amount - paid_amount) as total_debt,
                SUM(CASE WHEN payment_due_date < ? THEN total_amount - paid_amount ELSE 0 END) as overdue_debt,
                COUNT(CASE WHEN payment_due_date < ? THEN 1 END) as overdue_count
            ', [$today, $today])
            ->first();
        
        return response()->json($stats);
    }
}
