<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Offer;
use App\Models\Shop;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class MerchantSeeder extends Seeder
{
    /**
     * Seed a default merchant with a shop and subscription.
     */
    public function run(): void
    {
        // Créer le marchand
        $merchant = User::updateOrCreate(
            ['email' => 'marchand@bio.com'],
            [
                'name' => 'Marchand Bio',
                'phone' => '+225 0102030405',
                'password' => Hash::make('password123'),
                'is_admin' => false,
            ]
        );

        // Créer sa boutique si elle n'existe pas
        $shop = $merchant->shops()->firstOrCreate(
            ['name' => 'Ma Boutique Bio'],
            [
                'description' => 'Produits frais et naturels',
                'address' => 'Cocody, Abidjan',
            ]
        );

        // Créer quelques catégories pour ce marchand
        $fruitCat = $shop->categories()->firstOrCreate(['name' => 'Fruits']);
        $legumeCat = $shop->categories()->firstOrCreate(['name' => 'Légumes']);

        // Créer quelques produits si la boutique est vide
        if ($shop->products()->count() === 0) {
            $shop->products()->create([
                'category_id' => $fruitCat->id,
                'name' => 'Mangue',
                'description' => 'Mangue Kent mûre',
                'price' => 500,
                'stock_quantity' => 50,
                'stock_threshold' => 10,
            ]);

            $shop->products()->create([
                'category_id' => $legumeCat->id,
                'name' => 'Tomate',
                'description' => 'Tomate locale kg',
                'price' => 800,
                'stock_quantity' => 5, // Déjà en alerte
                'stock_threshold' => 10,
            ]);
        }

        // Lui donner un abonnement actif (Offre Professionnelle)
        $offer = Offer::where('name', 'Professionnel')->first();
        if ($offer && $merchant->activeSubscription === null) {
            $merchant->subscriptions()->create([
                'offer_id' => $offer->id,
                'started_at' => Carbon::now(),
                'ends_at' => Carbon::now()->addMonths(3), // On assume 3 mois par défaut ici
                'status' => 'active',
                'paid_price' => 12000,
            ]);
        }
    }
}
