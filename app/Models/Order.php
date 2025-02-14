<?php

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Order extends Model
{
    protected $fillable = ['customer_id', 'total_amount', 'status'];

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
     * The customer who created this order.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
