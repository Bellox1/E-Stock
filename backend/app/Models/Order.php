<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Shop;
use App\Models\Client;
use App\Models\OrderItem;

class Order extends Model
{
    protected $fillable = [
        'shop_id',
        'client_id',
        'total_amount',
        'paid_amount',
        'status',
        'payment_due_date',
        'payment_date',
        'debt_notes'
    ];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}
