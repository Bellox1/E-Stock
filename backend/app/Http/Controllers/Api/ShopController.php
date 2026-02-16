<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use Illuminate\Http\Request;

class ShopController extends Controller
{
    /**
     * Liste des boutiques de l'utilisateur connecté
     */
    public function index(Request $request)
    {
        return response()->json($request->user()->shops);
    }

    /**
     * Créer une nouvelle boutique
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $shopLimit = $user->getPermission('shops', 0);
        
        if ($user->shops()->count() >= $shopLimit) {
            return response()->json([
                'message' => "Limite de boutiques atteinte ($shopLimit). Veuillez passer à une offre supérieure."
            ], 403);
        }

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                function ($attribute, $value, $fail) use ($user) {
                    if ($user->shops()->whereRaw('LOWER(name) = ?', [strtolower($value)])->exists()) {
                        $fail('Vous avez déjà une boutique avec ce nom.');
                    }
                },
            ],
            'description' => 'nullable|string',
            'address' => 'nullable|string',
        ]);

        $shop = $user->shops()->create($validated);
        return response()->json($shop, 201);
    }

    /**
     * Voir une boutique spécifique
     */
    public function show(Request $request, Shop $shop)
    {
        if ($shop->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }
        return response()->json($shop);
    }

    /**
     * Modifier une boutique
     */
    public function update(Request $request, Shop $shop)
    {
        if ($shop->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'name' => [
                'string',
                'max:255',
                function ($attribute, $value, $fail) use ($request, $shop) {
                    if ($request->user()->shops()->whereRaw('LOWER(name) = ?', [strtolower($value)])->where('id', '!=', $shop->id)->exists()) {
                        $fail('Vous avez déjà une boutique avec ce nom.');
                    }
                },
            ],
            'description' => 'nullable|string',
            'address' => 'nullable|string',
        ]);

        $shop->update($validated);
        return response()->json($shop);
    }

    /**
     * Supprimer une boutique
     */
    public function destroy(Request $request, Shop $shop)
    {
        if ($shop->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $shop->delete();
        return response()->json(null, 204);
    }
}
