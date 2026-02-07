<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    protected $fillable = [
        'user_id',
        'local_id',
        'date_debut',
        'date_fin',
        'creneau',
        'nature_evenement',
        'participants_estimes',
        'motif',
        'statut',
        'priorite',
        'commentaire_admin',
        'validated_by',
        'validated_at',
        'cancelled_by',
        'cancelled_at',
        'cancellation_reason'
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
        'participants_estimes' => 'integer',
        'validated_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relations
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function local()
    {
        return $this->belongsTo(Local::class);
    }

    public function validator()
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    public function canceller()
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->whereIn('statut', ['en_attente', 'confirmee']);
    }

    public function scopeUpcoming($query)
    {
        return $query->where('date_fin', '>=', now());
    }

    public function scopePending($query)
    {
        return $query->where('statut', 'en_attente');
    }

    public function scopeConfirmed($query)
    {
        return $query->where('statut', 'confirmee');
    }

    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByLocal($query, $localId)
    {
        return $query->where('local_id', $localId);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('statut', $status);
    }

    public function scopeDateRange($query, $start, $end)
    {
        return $query->where('date_debut', '<=', $end)
                     ->where('date_fin', '>=', $start);
    }

    // Méthodes
    public function canBeCancelled()
    {
        if (!in_array($this->statut, ['en_attente', 'confirmee'])) {
            return false;
        }

        $reservationDateTime = $this->date_debut->copy();
        
        if ($this->creneau === 'matin') {
            $reservationDateTime->setTime(8, 0);
        } elseif ($this->creneau === 'apres-midi') {
            $reservationDateTime->setTime(14, 0);
        } else {
            $reservationDateTime->setTime(8, 0);
        }

        return now()->diffInHours($reservationDateTime, false) >= 12;
    }

    public function requiresValidation()
    {
        $duration = $this->date_debut->diffInDays($this->date_fin);
        
        if ($duration > 1) {
            return true;
        }

        $officialEvents = ['audience', 'convention', 'congres'];
        return in_array($this->nature_evenement, $officialEvents);
    }

    public function getStatusLabelAttribute()
    {
        $labels = [
            'en_attente' => 'En attente',
            'confirmee' => 'Confirmée',
            'annulee_utilisateur' => 'Annulée par utilisateur',
            'annulee_admin' => 'Annulée par admin',
            'refusee' => 'Refusée'
        ];

        return $labels[$this->statut] ?? $this->statut;
    }

    public function getCreneauLabelAttribute()
    {
        $labels = [
            'matin' => 'Matin',
            'apres-midi' => 'Après-midi',
            'journee-complete' => 'Journée complète'
        ];

        return $labels[$this->creneau] ?? $this->creneau;
    }
}