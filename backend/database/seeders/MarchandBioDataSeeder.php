<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Shop;
use App\Models\Client;
use App\Models\Product;
use App\Models\Order;
use App\Models\Category;
use Illuminate\Database\Seeder;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class MarchandBioDataSeeder extends Seeder
{
    public function run(): void
    {
        $userId = 2; // ID identifié pour Marchand Bio
        $user = User::find($userId);

        if (!$user) {
            $this->command->error("Utilisateur Marchand Bio non trouvé !");
            return;
        }

        $this->command->info("Nettoyage et génération de données pour : " . $user->name);

        // --- VIDER LES DONNEES EXISTANTES ---
        $this->command->warn("Suppression des anciennes données...");
        
        // Supprimer les clients (lié directement au user)
        Client::where('user_id', $userId)->delete();
        
        // Supprimer les boutiques (le cascade onDelete gère Orders, Products, Categories etc.)
        $userShops = Shop::where('user_id', $userId)->get();
        foreach($userShops as $shop) {
            $shop->delete();
        }

        // --- REINITIALISER LES BOUTIQUES ---
        $shopNames = ['Boutique Bio Plateau', 'Entrepôt Bio Akpakpa'];
        $allShops = [];
        foreach ($shopNames as $name) {
            $allShops[] = Shop::create([
                'user_id' => $userId, 
                'name' => $name,
                'address' => 'Cotonou, Bénin'
            ]);
        }
        
        $categoriesNames = ['Légumes', 'Fruits', 'Céréales', 'Huiles'];
        $productsByCat = [
            'Légumes' => [
                ['name' => 'Tomate Bio', 'price' => 500],
                ['name' => 'Carotte Fraiche', 'price' => 700],
            ],
            'Fruits' => [
                ['name' => 'Mangue Greffée', 'price' => 200],
                ['name' => 'Ananas Pain de Sucre', 'price' => 400],
            ],
            'Céréales' => [
                ['name' => 'Riz Local 5kg', 'price' => 3500],
                ['name' => 'Maïs Jaune', 'price' => 250],
            ],
            'Huiles' => [
                ['name' => 'Huile de Palme 1L', 'price' => 1200],
                ['name' => 'Miel Pur', 'price' => 2500],
            ],
        ];

        $allProducts = [];

        foreach ($allShops as $shop) {
            $this->command->info("Génération produits pour : " . $shop->name);
            foreach ($categoriesNames as $catName) {
                $category = Category::create([
                    'shop_id' => $shop->id,
                    'name' => $catName
                ]);

                foreach ($productsByCat[$catName] as $p) {
                    $allProducts[] = Product::create([
                        'shop_id' => $shop->id,
                        'name' => $p['name'],
                        'price' => $p['price'],
                        'category_id' => $category->id,
                        'stock_quantity' => rand(50, 200),
                        'stock_threshold' => 10,
                        'description' => "Produit $catName bio de qualité supérieure."
                    ]);
                }
            }
        }

        // --- 20 CLIENTS ---
        $clients = [];
        for ($i = 1; $i <= 20; $i++) {
            $clients[] = Client::create([
                'user_id' => $userId,
                'name' => "Client Bio $i",
                'phone' => "97" . rand(100000, 999999),
                'email' => "client$i@example.com",
                'address' => "Cotonou, Quartier Bio $i"
            ]);
        }

        // --- 100 COMMANDES ---
        $this->command->info("Génération de 100 commandes...");
        for ($i = 0; $i < 100; $i++) {
            $shop = collect($allShops)->random();
            $client = collect($clients)->random();
            $date = Carbon::now()->subDays(rand(0, 60)); 
            
            $numItems = rand(1, 4);
            $orderProducts = collect($allProducts)->where('shop_id', $shop->id)->random(min($numItems, 2)); // Limit for safety
            
            $totalAmount = 0;
            $itemsData = [];
            foreach ($orderProducts as $p) {
                $qty = rand(1, 5);
                $totalAmount += $p->price * $qty;
                $itemsData[] = [
                    'product_id' => $p->id,
                    'quantity' => $qty,
                    'unit_price' => $p->price,
                ];
            }

            $paidAmount = 0;
            $status = 'credit';
            $dueDate = null;

            $r = rand(1, 100);
            if ($r > 60) {
                $paidAmount = $totalAmount;
                $status = 'paid';
            } elseif ($r > 30) {
                $paidAmount = round(($totalAmount * rand(20, 80)) / 100);
                $status = 'partial';
                $dueDate = $date->copy()->addDays(rand(-5, 15)); 
            } else {
                $paidAmount = 0;
                $status = 'credit';
                $dueDate = $date->copy()->addDays(rand(1, 25));
            }

            $order = Order::create([
                'shop_id' => $shop->id,
                'client_id' => $client->id,
                'total_amount' => $totalAmount,
                'paid_amount' => $paidAmount,
                'status' => $status,
                'payment_due_date' => $dueDate,
                'created_at' => $date,
                'updated_at' => $date,
            ]);

            foreach ($itemsData as $item) {
                $order->items()->create($item);
            }
        }

        $this->command->info("Terminé ! Marchand Bio a maintenant un compte prêt pour les tests.");
    }
}
