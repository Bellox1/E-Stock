<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OfferPrice extends Model
{
    protected $fillable = [
        'offer_id',
        'duration_months',
        'price',
        'discount_percentage',
    ];

    public function offer()
    {
        return $this->belongsTo(Offer::class);
    }
}
