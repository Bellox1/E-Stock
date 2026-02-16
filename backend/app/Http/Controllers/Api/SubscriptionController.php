<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Carbon\Carbon;

class SubscriptionController extends Controller
{
    /**
     * Liste tous les abonnements (Admin uniquement)
     */
    public function index()
    {
        return response()->json(Subscription::with(['user', 'offer'])->latest()->get());
    }

    /**
     * Obtenir l'abonnement actuel de l'utilisateur
     */
    public function current(Request $request)
    {
        $subscription = $request->user()->activeSubscription;
        if (!$subscription) {
            return response()->json(['message' => 'Aucun abonnement actif'], 404);
        }
        return response()->json($subscription->load('offer'));
    }

    /**
     * Souscrire à une offre
     */
    public function subscribe(Request $request)
    {
        $validated = $request->validate([
            'offer_id' => 'required|exists:offers,id',
            'duration_months' => 'required|integer|min:1',
        ]);

        $offer = Offer::findOrFail($validated['offer_id']);
        
        // Verify valid duration
        $validDuration = collect($offer->prices)->contains('duration_months', $validated['duration_months']);
        if (!$validDuration) {
            return response()->json(['message' => 'Durée invalide pour cette offre'], 422);
        }

        $user = $request->user();
        $activeSub = $user->activeSubscription;
        
        // Determine start date: if it's a renewal of the same offer, stack the duration
        $startDate = Carbon::now();
        if ($activeSub && $activeSub->offer_id == $offer->id) {
            $startDate = Carbon::parse($activeSub->ends_at);
        }

        // Calculate price based on duration and rules
        $price = 0;
        foreach ($offer->prices as $priceOption) {
            if ($priceOption['duration_months'] == $validated['duration_months']) {
                $price = $priceOption['price'];
                break;
            }
        }

        $subscription = $user->subscriptions()->create([
            'offer_id' => $offer->id,
            'user_id' => $user->id,
            'started_at' => Carbon::now(),
            'ends_at' => $startDate->addMonths($validated['duration_months']),
            'status' => 'active',
            'paid_price' => $price,
        ]);

        return response()->json($subscription->load('offer'), 201);
    }

    /**
     * Voir un abonnement
     */
    public function show(Subscription $subscription)
    {
        return response()->json($subscription->load(['user', 'offer']));
    }
}
