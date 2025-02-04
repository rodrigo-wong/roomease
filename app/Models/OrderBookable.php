<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderBookable extends Model
{
    protected $fillable = ['order_id', 'bookable_id', 'quantity', 'start_time', 'end_time'];

    /**
     * Get the associated Order.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Get the associated Bookable (Contractor, Room, or Product).
     */
    public function bookable(): BelongsTo
    {
        return $this->belongsTo(Bookable::class);
    }
}
