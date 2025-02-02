<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Contractor extends Model
{
    use HasFactory;

    protected $fillable = ['bookable_id', 'email', 'phone_number', 'role'];

    public function bookable(): BelongsTo
    {
        return $this->belongsTo(Bookable::class);
    }
}
