<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContractorRole extends Model
{
    //
    protected $fillable = ['name', 'description', 'rate'];

    public function contractors()
    {
        return $this->hasMany(Contractor::class);
    }
    public $timestamps = false; // Disable automatic timestamps

}
