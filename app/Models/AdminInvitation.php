<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdminInvitation extends Model
{
    use HasFactory;

    protected $fillable = [
        'email',
        'token',
        'invited_by',
        'expires_at'
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'accepted_at' => 'datetime',
    ];

    /**
     * Get the admin who sent the invitation
     */
    public function inviter()
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    /**
     * Check if the invitation has expired
     */
    public function isExpired()
    {
        return $this->expires_at->isPast();
    }

    /**
     * Check if the invitation has been accepted
     */
    public function isAccepted()
    {
        return $this->accepted_at !== null;
    }

    /**
     * Check if the invitation is valid (not expired and not accepted)
     */
    public function isValid()
    {
        return !$this->isAccepted() && !$this->isExpired();
    }
}
