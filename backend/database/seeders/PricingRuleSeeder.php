<?php

namespace Database\Seeders;

use App\Models\PricingRule;
use Illuminate\Database\Seeder;

class PricingRuleSeeder extends Seeder
{
    public function run(): void
    {
        PricingRule::truncate();

        PricingRule::create([
            'duration_months' => 3,
            'discount_percentage' => 10, // 10% de réduction pour 3 mois
        ]);

        PricingRule::create([
            'duration_months' => 6,
            'discount_percentage' => 15,
        ]);

        PricingRule::create([
            'duration_months' => 12,
            'discount_percentage' => 25, // 25% de réduction pour 12 mois
        ]);
    }
}
