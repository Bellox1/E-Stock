<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Shop;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    /**
     * Liste des produits d'une boutique
     */
    public function index(Request $request)
    {
        $request->validate(['shop_id' => 'required|exists:shops,id']);
        $shop = Shop::findOrFail($request->shop_id);

        if ($shop->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $products = $shop->products()->with('category')->get();
        return response()->json($products);
    }

    /**
     * Créer un produit
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $productLimit = $user->getPermission('products', 0);

        // Compter tous les produits de toutes les boutiques de l'utilisateur
        $totalProducts = Product::whereHas('shop', function($q) use ($user) {
            $q->where('user_id', $user->id);
        })->count();

        if ($totalProducts >= $productLimit) {
            return response()->json([
                'message' => "Limite de produits atteinte ($productLimit). Veuillez passer à une offre supérieure."
            ], 403);
        }

        $validated = $request->validate([
            'shop_id' => 'required|exists:shops,id',
            'category_id' => 'nullable|exists:categories,id',
            'name' => [
                'required',
                'string',
                'max:255',
                function ($attribute, $value, $fail) use ($request) {
                    if (Product::where('shop_id', $request->shop_id)->whereRaw('LOWER(name) = ?', [strtolower($value)])->exists()) {
                        $fail('Ce nom de produit existe déjà dans cette boutique.');
                    }
                },
            ],
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'stock_threshold' => 'nullable|integer|min:0',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120', // Images jusqu'à 5MB
        ]);

        $shop = Shop::findOrFail($validated['shop_id']);
        if ($shop->user_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products/' . $user->id, 'public');
            $validated['image_url'] = env('APP_URL') . '/storage/' . $path;
        }

        $product = $shop->products()->create($validated);
        return response()->json($product, 201);
    }

    /**
     * Voir un produit
     */
    public function show(Request $request, Product $product)
    {
        if ($product->shop->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }
        return response()->json($product->load('category'));
    }

    /**
     * Modifier un produit
     */
    public function update(Request $request, Product $product)
    {
        if ($product->shop->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'category_id' => 'nullable|exists:categories,id',
            'name' => [
                'string',
                'max:255',
                function ($attribute, $value, $fail) use ($product) {
                    if (Product::where('shop_id', $product->shop_id)
                        ->whereRaw('LOWER(name) = ?', [strtolower($value)])
                        ->where('id', '!=', $product->id)
                        ->exists()) {
                        $fail('Ce nom de produit existe déjà dans cette boutique.');
                    }
                },
            ],
            'description' => 'nullable|string',
            'price' => 'numeric|min:0',
            'stock_quantity' => 'integer|min:0',
            'stock_threshold' => 'integer|min:0',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        if ($request->hasFile('image')) {
            // Supprimer l'ancienne image si elle existe
            if ($product->image_url) {
                $oldPath = str_replace(url('/storage/'), '', $product->image_url);
                // Si l'URL ne contient pas l'URL de base, essayer avec APP_URL
                if ($oldPath === $product->image_url) {
                    $oldPath = str_replace(env('APP_URL') . '/storage/', '', $product->image_url);
                }
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('image')->store('products/' . $request->user()->id, 'public');
            $validated['image_url'] = url('/storage/' . $path);
        }

        $product->update($validated);
        return response()->json($product);
    }

    /**
     * Supprimer un produit
     */
    public function destroy(Request $request, Product $product)
    {
        if ($product->shop->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $orderCount = $product->orderItems()->count();
        
        if ($orderCount > 0 && !$request->has('force')) {
            return response()->json([
                'message' => "Ce produit est lié à $orderCount vente(s). Vous devez supprimer ces ventes d'abord ou confirmer la suppression de tout l'historique lié.",
                'requires_force' => true
            ], 400);
        }

        if ($request->has('force')) {
            // Récupérer les IDs des commandes liées
            $orderIds = $product->orderItems()->pluck('order_id')->unique();
            // Supprimer les items de toutes ces commandes (pour éviter les erreurs de contraintes)
            OrderItem::whereIn('order_id', $orderIds)->delete();
            // Supprimer les commandes elles-mêmes
            Order::whereIn('id', $orderIds)->delete();
        }

        // Supprimer l'image si elle existe
        if ($product->image_url) {
            $path = str_replace(url('/storage/'), '', $product->image_url);
            if ($path === $product->image_url) {
                $path = str_replace(env('APP_URL') . '/storage/', '', $product->image_url);
            }
            Storage::disk('public')->delete($path);
        }

        $product->delete();
        return response()->json(['message' => 'Produit et historique des ventes supprimés'], 200);
    }
}
