<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Offer extends Model
{
    protected $fillable = [
        'name',
        'base_price',
        'permissions',
        'description',
        'is_free_temporary',
    ];

    protected $casts = [
        'permissions' => 'array',
        'is_free_temporary' => 'boolean',
        'base_price' => 'decimal:2',
    ];

    protected $appends = ['prices'];

    public function getPricesAttribute()
    {
        $base = $this->base_price;
        if (!$base) return [];

        $prices = [];
        
        // Add Base Price (1 Month)
        $prices[] = [
            'duration_months' => 1,
            'price' => (float)$base,
            'discount_percentage' => 0
        ];

        // Fetch Global Rules
        $rules = PricingRule::all(); // This might be better cached or injected
        
        foreach ($rules as $rule) {
            $rawPrice = $base * $rule->duration_months;
            $finalPrice = round($rawPrice * (1 - ($rule->discount_percentage / 100)));
            
            $prices[] = [
                'duration_months' => $rule->duration_months,
                'price' => (float)$finalPrice,
                'discount_percentage' => $rule->discount_percentage
            ];
        }

        return $prices;
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }
}
