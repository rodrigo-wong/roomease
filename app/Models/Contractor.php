<?php

namespace App\Models;

use App\Models\ContractorRole;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Contractor extends Model
{
    use HasFactory;

    protected $fillable = ['bookable_id', 'name', 'email', 'phone_number', 'role_id'];

    public function bookable(): BelongsTo
    {
        return $this->belongsTo(Bookable::class);
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(ContractorRole::class, 'role_id');
    }
}
