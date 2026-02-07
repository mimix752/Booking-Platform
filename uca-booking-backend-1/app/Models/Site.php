<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Site extends Model
{
    protected $fillable = [
        'site_id',
        'nom',
        'adresse',
        'description',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relations
    public function locaux()
    {
        return $this->hasMany(Local::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Accessors
    public function getLocauxCountAttribute()
    {
        return $this->locaux()->where('is_active', true)->count();
    }

    public function getTotalCapaciteAttribute()
    {
        return $this->locaux()->where('is_active', true)->sum('capacite');
    }
}