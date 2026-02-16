<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Shop;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    /**
     * Liste des catégories d'une boutique
     */
    public function index(Request $request)
    {
        $request->validate(['shop_id' => 'required|exists:shops,id']);
        $shop = Shop::findOrFail($request->shop_id);

        if ($shop->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        return response()->json($shop->categories);
    }

    /**
     * Créer une catégorie
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'shop_id' => 'required|exists:shops,id',
            'name' => 'required|string|max:255',
        ]);

        $shop = Shop::findOrFail($validated['shop_id']);
        if ($shop->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $category = $shop->categories()->create(['name' => $validated['name']]);
        return response()->json($category, 201);
    }

    /**
     * Voir une catégorie
     */
    public function show(Request $request, Category $category)
    {
        if ($category->shop->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }
        return response()->json($category);
    }

    /**
     * Modifier une catégorie
     */
    public function update(Request $request, Category $category)
    {
        if ($category->shop->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $category->update($validated);
        return response()->json($category);
    }

    /**
     * Supprimer une catégorie
     */
    public function destroy(Request $request, Category $category)
    {
        if ($category->shop->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $category->delete();
        return response()->json(null, 204);
    }
}
