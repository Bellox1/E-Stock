<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Offer;

class OfferSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Nettoyer les anciennes offres
        \Illuminate\Support\Facades\DB::statement('DELETE FROM offers');

        Offer::create([
            'name' => 'Basique',
            'base_price' => 5000,
            'permissions' => [
                'shops' => 1,
                'products' => 100,
                'clients' => 50,
                'stock_alerts' => true,
                'alerts' => false,
                'invoices' => false,
                'stats' => false,
            ],
            'description' => 'Idéal pour débuter votre activité.',
        ]);

        Offer::create([
            'name' => 'Professionnel',
            'base_price' => 10000,
            'permissions' => [
                'shops' => 3,
                'products' => 500,
                'clients' => 200,
                'stock_alerts' => true,
                'alerts' => true,
                'invoices' => true,
                'stats' => true,
            ],
            'description' => 'Pour les commerces en croissance.',
        ]);

        Offer::create([
            'name' => 'Premium',
            'base_price' => 25000,
            'permissions' => [
                'shops' => 10,
                'products' => 2000,
                'clients' => 1000,
                'stock_alerts' => true,
                'alerts' => true,
                'invoices' => true,
                'stats' => true,
            ],
            'description' => 'La solution complète pour votre entreprise.',
        ]);
    }
}
