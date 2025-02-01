<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookableAvailability extends Model
{
    use HasFactory;

    protected $fillable = [
        'bookable_id',
        'day_of_week', // 0 = Sunday, 6 = Saturday
        'start_time',
        'end_time'
    ];

    /**
     * Get the bookable entity (Contractor, Room, Product) that this availability belongs to.
     */
    public function bookable(): BelongsTo
    {
        return $this->belongsTo(Bookable::class);
    }
}
