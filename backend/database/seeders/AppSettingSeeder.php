<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AppSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\AppSetting::updateOrCreate(
            ['key' => 'default_permissions'],
            [
                'value' => [
                    'shops' => 1,
                    'products' => 0,
                    'clients' => 0,
                    'stock_alerts' => true,
                    'alerts' => false,
                    'invoices' => false,
                    'stats' => false
                ],
                'description' => 'Permissions par défaut pour les nouveaux comptes marchands sans abonnement.'
            ]
        );
    }
}
