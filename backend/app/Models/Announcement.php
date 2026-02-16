<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    protected $fillable = ['title', 'content', 'image_url', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
