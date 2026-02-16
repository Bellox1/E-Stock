<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    /**
     * Liste des clients de l'utilisateur
     */
    public function index(Request $request)
    {
        return response()->json($request->user()->clients);
    }

    /**
     * Ajouter un client
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $clientLimit = $user->getPermission('clients', 0);

        if ($user->clients()->count() >= $clientLimit) {
            return response()->json([
                'message' => "Limite de clients atteinte ($clientLimit). Veuillez passer à une offre supérieure."
            ], 403);
        }

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                function ($attribute, $value, $fail) use ($user) {
                    if ($user->clients()->whereRaw('LOWER(name) = ?', [strtolower($value)])->exists()) {
                        $fail('Un client avec ce nom existe déjà.');
                    }
                },
            ],
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
        ], [
            'name.required' => 'Le nom du client est obligatoire.',
            'email.email' => 'Veuillez entrer une adresse email valide.',
            'email.max' => 'L\'email ne doit pas dépasser 255 caractères.',
            'phone.max' => 'Le numéro de téléphone est trop long.',
        ]);

        $client = $user->clients()->create($validated);
        return response()->json($client, 201);
    }

    /**
     * Voir un client
     */
    public function show(Request $request, Client $client)
    {
        if ($client->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }
        return response()->json($client->load('orders'));
    }

    /**
     * Modifier un client
     */
    public function update(Request $request, Client $client)
    {
        if ($client->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'name' => [
                'string',
                'max:255',
                function ($attribute, $value, $fail) use ($client) {
                    if (Client::where('user_id', $client->user_id)
                        ->whereRaw('LOWER(name) = ?', [strtolower($value)])
                        ->where('id', '!=', $client->id)
                        ->exists()) {
                        $fail('Un client avec ce nom existe déjà.');
                    }
                },
            ],
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
        ], [
            'email.email' => 'Veuillez entrer une adresse email valide.',
            'email.max' => 'L\'email ne doit pas dépasser 255 caractères.',
            'phone.max' => 'Le numéro de téléphone est trop long.',
        ]);

        $client->update($validated);
        return response()->json($client);
    }

    /**
     * Supprimer un client
     */
    public function destroy(Request $request, Client $client)
    {
        if ($client->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $orderCount = $client->orders()->count();
        if ($orderCount > 0 && !$request->has('force')) {
            return response()->json([
                'message' => "Ce client est lié à $orderCount vente(s). Vous devez supprimer son historique d'abord ou forcer la suppression.",
                'requires_force' => true
            ], 400);
        }

        if ($request->has('force')) {
            // Delete associated orders and order items
            foreach ($client->orders as $order) {
                $order->items()->delete();
                $order->delete();
            }
        }

        $client->delete();
        return response()->json(['message' => 'Client supprimé'], 200);
    }
}
