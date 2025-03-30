<?php

namespace App\Models;

use App\Enums\BookableType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Bookable extends Model
{
    use HasFactory;

    protected $fillable = ['rate', 'bookable_type', 'is_room_group', 'room_ids'];

    protected $casts = [
        'bookable_type' => BookableType::class, // Casts bookable_type as Enum
        'room_ids' => 'array',
        'is_room_group' => 'boolean',
    ];

    protected $appends = ['display_name', 'display_description', 'display_capacity'];



    /**
     * Get the display name for this bookable
     */
    public function getDisplayNameAttribute()
    {
        if (!$this->is_room_group) {
            return $this->room ? $this->room->name : null;
        }

        // For room groups, create a name based on included rooms
        $roomNames = Bookable::whereIn('id', $this->room_ids ?? [])
            ->with('room')
            ->get()
            ->pluck('room.name')
            ->filter()
            ->toArray();

        return implode(', ', $roomNames);
    }

    /**
     * Get the description for display
     */
    public function getDisplayDescriptionAttribute()
    {
        if (!$this->is_room_group) {
            return $this->room ? $this->room->description : null;
        }

        // For room groups, create a description that lists the included rooms
        $roomNames = Bookable::whereIn('id', $this->room_ids ?? [])
            ->with('room')
            ->get()
            ->pluck('room.name')
            ->filter()
            ->toArray();

        return 'Includes: ' . implode(', ', $roomNames);
    }

    /**
     * Get the combined capacity
     */
    public function getDisplayCapacityAttribute()
    {
        if (!$this->is_room_group) {
            return $this->room ? $this->room->capacity : null;
        }

        // For room groups, sum up the capacities
        return Bookable::whereIn('id', $this->room_ids ?? [])
            ->with('room')
            ->get()
            ->sum(function ($bookable) {
                return $bookable->room ? $bookable->room->capacity : 0;
            });
    }

    /**
     * Get the individual rooms that are part of this room group
     */
    public function groupRooms()
    {
        if (!$this->is_room_group) {
            return collect([]);
        }

        return Bookable::whereIn('id', $this->room_ids ?? [])->get();
    }

    /**
     * Get the contractor associated with the bookable.
     */
    public function contractor()
    {
        return $this->hasOne(Contractor::class, 'bookable_id');
    }

    /**
     * Get the room associated with the bookable.
     */
    public function room()
    {
        return $this->hasOne(Room::class, 'bookable_id');
    }

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

    public function product()
    {
        return $this->hasOne(Product::class);
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
        return $query->where('bookable_type', BookableType::CONTRACTOR)->with('contractor.role');
    }

    /**
     * Get the room associated with the bookable.
     */
    public function scopeRooms($query)
    {
        return $query->where('bookable_type', BookableType::ROOM)->with('room');
    }


    /**
     * Get the product associated with the bookable.
     */
    public function scopeProducts($query)
    {
        return $query->where('bookable_type', BookableType::PRODUCT)->with('product.category');
    }

    /**
     * Get the room groups
     */
    public function scopeRoomGroups($query)
    {
        return $query->where('is_room_group', true);
    }

    /**
     * Get the individual rooms (not groups)
     */
    public function scopeIndividualRooms($query)
    {
        return $query->where('bookable_type', BookableType::ROOM)
            ->where('is_room_group', false)
            ->with('room');
    }

    /**
     * Delete related records when deleting a bookable
     */
    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($bookable) {
            // Delete availability entries
            $bookable->availability()->delete();

            // Delete related records based on type
            if ($bookable->bookable_type === BookableType::PRODUCT) {
                $bookable->product()->delete();
            } elseif ($bookable->bookable_type === BookableType::ROOM && !$bookable->is_room_group) {
                $bookable->room()->delete();
            } elseif ($bookable->bookable_type === BookableType::CONTRACTOR) {
                $bookable->contractor()->delete();
            }
        });
    }
}
