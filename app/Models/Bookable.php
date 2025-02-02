<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Enums\BookableType;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Bookable extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'rate', 'description', 'bookable_type'];

    protected $casts = [
        'bookable_type' => BookableType::class, // Casts bookable_type as Enum
    ];

    /**
     * Get the availability for the bookable.
     */
    public function availability()
    {
        return $this->hasMany(BookableAvailability::class);
    }

    /**
     * Get the orders associated with the bookable.
     */
    public function orders()
    {
        return $this->hasMany(OrderBookable::class);
    }

    /**
     * Get the payments associated with the bookable.
     */
    public function payments()
    {
        return $this->hasManyThrough(Payment::class, OrderBookable::class);
    }

    /**
     * Get the contractor associated with the bookable.
     */
    public function scopeContractors($query)
    {
        return $query->where('bookable_type', BookableType::CONTRACTOR);
    }

    /**
     * Get the room associated with the bookable.
     */
    public function scopeRooms($query)
    {
        return $query->where('bookable_type', BookableType::ROOM);
    }


    /**
     * Get the product associated with the bookable.
     */
    public function scopeProducts($query)
    {
        return $query->where('bookable_type', BookableType::PRODUCT);
    }
}
