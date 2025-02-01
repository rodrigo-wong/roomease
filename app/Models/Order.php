<?php

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Order extends Model
{
    protected $fillable = ['user_id', 'total_amount', 'status'];

    protected $casts = [
        'status' => OrderStatus::class, 
    ];

    /**
     * Get all bookables associated with this order.
     */
    public function orderBookables(): HasMany
    {
        return $this->hasMany(OrderBookable::class);
    }

    /**
     * The user who created this order.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
