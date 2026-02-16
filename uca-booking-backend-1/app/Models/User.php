<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable, HasFactory;

    protected $fillable = [
        'google_id',
        'email',
        'name',
        'picture',
        'fonction',
        'telephone',
        'role',
        'is_active',
        'last_login',
        'password',
    ];

    protected $hidden = [
        'remember_token',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_login' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relations
    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }

    public function validatedReservations()
    {
        return $this->hasMany(Reservation::class, 'validated_by');
    }

    public function logs()
    {
        return $this->hasMany(Log::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeAdmin($query)
    {
        return $query->where('role', 'admin');
    }

    // Accessors
    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    public function getActiveReservationsCountAttribute()
    {
        return $this->reservations()
            ->whereIn('statut', ['en_attente', 'confirmee'])
            ->where('date_fin', '>=', now())
            ->count();
    }
}
