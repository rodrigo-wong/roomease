<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContractorRole extends Model
{
    public $timestamps = false;

    protected $fillable = ['name', 'description', 'rate'];

    public function contractors()
    {
        return $this->hasMany(Contractor::class);
    }
}
