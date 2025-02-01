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
}
