<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    public $timestamps = false; 
    
    protected $fillable = ['bookable_id', 'name', 'description', 'capacity'];

    public function bookable()
    {
        return $this->belongsTo(Bookable::class);
    }
}
