<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use Illuminate\Http\Request;

class OfferController extends Controller
{
    /**
     * Liste toutes les offres (Public/Commerçant)
     */
    public function index()
    {
        return response()->json(Offer::all());
    }

    /**
     * Créer une offre (Admin uniquement)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'permissions' => 'required|array',
            'description' => 'nullable|string',
            'is_free_temporary' => 'boolean',
            'base_price' => 'required|numeric|min:0',
        ], [
            'name.required' => 'Le nom de l\'offre est obligatoire.',
            'base_price.required' => 'Le prix de base est obligatoire.',
            'permissions.required' => 'Les permissions sont obligatoires.'
        ]);

        $offer = Offer::create($validated);
        return response()->json($offer, 201);
    }

    /**
     * Voir une offre spécifique
     */
    public function show(Offer $offer)
    {
        return response()->json($offer);
    }

    /**
     * Modifier une offre (Admin uniquement)
     */
    public function update(Request $request, Offer $offer)
    {
        $validated = $request->validate([
            'name' => 'string|max:255',
            'permissions' => 'array',
            'description' => 'nullable|string',
            'is_free_temporary' => 'boolean',
            'base_price' => 'numeric|min:0',
        ]);

        $offer->update($validated);
        return response()->json($offer);
    }

    /**
     * Supprimer une offre (Admin uniquement)
     */
    public function destroy(Offer $offer)
    {
        $offer->delete();
        return response()->json(null, 204);
    }
}
