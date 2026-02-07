<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Local extends Model
{
    protected $table = 'locaux';

    protected $fillable = [
        'site_id',
        'nom',
        'capacite',
        'equipements',
        'statut',
        'contraintes',
        'description',
        'image_url',
        'is_active'
    ];

    protected $casts = [
        'equipements' => 'array',
        'is_active' => 'boolean',
        'capacite' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relations
    public function site()
    {
        return $this->belongsTo(Site::class);
    }

    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeDisponible($query)
    {
        return $query->where('statut', 'disponible');
    }

    public function scopeBySite($query, $siteId)
    {
        return $query->where('site_id', $siteId);
    }

    public function scopeMinCapacity($query, $capacity)
    {
        return $query->where('capacite', '>=', $capacity);
    }

    // Méthodes
    public function isAvailable($dateDebut, $dateFin, $creneau, $excludeReservationId = null)
    {
        $query = $this->reservations()
            ->whereIn('statut', ['confirmee', 'en_attente'])
            ->where('date_debut', '<=', $dateFin)
            ->where('date_fin', '>=', $dateDebut)
            ->where(function($q) use ($creneau) {
                $q->where('creneau', $creneau)
                  ->orWhere('creneau', 'journee-complete')
                  ->orWhere(function($q2) use ($creneau) {
                      if ($creneau === 'journee-complete') {
                          $q2->whereIn('creneau', ['matin', 'apres-midi', 'journee-complete']);
                      }
                  });
            });

        if ($excludeReservationId) {
            $query->where('id', '!=', $excludeReservationId);
        }

        return $query->count() === 0;
    }

    public function getReservationsCount()
    {
        return $this->reservations()->count();
    }

    public function getOccupancyRate()
    {
        $total = $this->reservations()->count();
        $confirmed = $this->reservations()->where('statut', 'confirmee')->count();
        
        return $total > 0 ? round(($confirmed / $total) * 100, 2) : 0;
    }
}