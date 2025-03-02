<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Enums\OrderBookableStatus;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Order extends Model
{
    protected $fillable = ['customer_id', 'total_amount', 'status', 'notes'];

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

    public function isCompleted(): bool
    {
        return $this->orderBookables()->get()->every(function ($orderBookable) {
            return $orderBookable->status === OrderBookableStatus::CONFIRMED->value;
        });
    }
}
