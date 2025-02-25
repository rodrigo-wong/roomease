<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class OrderBookable extends Model
{
    protected $fillable = [
        'order_id',
        'bookable_id',
        'bookable_type', 
        'quantity',
        'status',
        'start_time',
        'end_time'
    ];

    /**
     * Get the associated Order.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Get the associated polymorphic bookable (Bookables, or ContractorRole).
     */
    public function bookable(): MorphTo
    {
        return $this->morphTo();
    }
}
