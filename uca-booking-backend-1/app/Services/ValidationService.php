<?php

namespace App\Services;

use App\Models\Reservation;
use App\Models\Local;
use App\Models\BlackoutDate;
use Carbon\Carbon;

class ValidationService
{
    /**
     * Valider la disponibilité d'un local
     */
    public function validateAvailability($localId, $dateDebut, $dateFin, $creneau, $excludeReservationId = null)
    {
        $local = Local::find($localId);

        if (!$local) {
            return [
                'valid' => false,
                'message' => 'Local non trouvé'
            ];
        }

        if (!$local->is_active) {
            return [
                'valid' => false,
                'message' => 'Ce local n\'est pas actif'
            ];
        }

        if ($local->statut === 'maintenance') {
            return [
                'valid' => false,
                'message' => 'Ce local est en maintenance'
            ];
        }

        // Vérifier les blackout dates
        $blackoutCheck = $this->checkBlackoutDates($dateDebut, $dateFin);
        if (!$blackoutCheck['valid']) {
            return $blackoutCheck;
        }

        // Vérifier les conflits de réservations
        $isAvailable = $local->isAvailable($dateDebut, $dateFin, $creneau, $excludeReservationId);

        if (!$isAvailable) {
            return [
                'valid' => false,
                'message' => 'Ce créneau est déjà réservé'
            ];
        }

        return [
            'valid' => true,
            'message' => 'Créneau disponible'
        ];
    }

    /**
     * Vérifier les blackout dates
     */
    public function checkBlackoutDates($dateDebut, $dateFin)
    {
        $start = Carbon::parse($dateDebut);
        $end = Carbon::parse($dateFin);

        $blackoutDates = BlackoutDate::whereBetween('date', [$start, $end])->get();

        if ($blackoutDates->count() > 0) {
            $blockedDates = $blackoutDates->pluck('date')->map(function($date) {
                return Carbon::parse($date)->format('d/m/Y');
            })->implode(', ');

            return [
                'valid' => false,
                'message' => "Les dates suivantes sont bloquées : {$blockedDates}",
                'blocked_dates' => $blackoutDates->pluck('date')->toArray()
            ];
        }

        return [
            'valid' => true,
            'message' => 'Aucune date bloquée'
        ];
    }

    /**
     * Valider la capacité du local
     */
    public function validateCapacity($localId, $participantsEstimes)
    {
        $local = Local::find($localId);

        if (!$local) {
            return [
                'valid' => false,
                'message' => 'Local non trouvé'
            ];
        }

        if ($participantsEstimes > $local->capacite) {
            return [
                'valid' => false,
                'message' => "Ce local peut accueillir maximum {$local->capacite} personnes",
                'max_capacity' => $local->capacite
            ];
        }

        // Avertissement si > 90% de la capacité
        if ($participantsEstimes > ($local->capacite * 0.9)) {
            return [
                'valid' => true,
                'warning' => true,
                'message' => "Attention : vous approchez de la capacité maximale du local ({$local->capacite} personnes)"
            ];
        }

        return [
            'valid' => true,
            'message' => 'Capacité adéquate'
        ];
    }

    /**
     * Vérifier si une réservation nécessite validation
     */
    public function requiresValidation($dateDebut, $dateFin, $natureEvenement)
    {
        $duration = Carbon::parse($dateDebut)->diffInDays(Carbon::parse($dateFin));

        // Validation obligatoire si > 1 jour
        if ($duration > 1) {
            return [
                'requires' => true,
                'reason' => 'Réservation sur plusieurs jours'
            ];
        }

        // Validation obligatoire pour événements officiels
        $officialEvents = ['audience', 'convention', 'congres'];
        if (in_array($natureEvenement, $officialEvents)) {
            return [
                'requires' => true,
                'reason' => 'Événement à caractère officiel'
            ];
        }

        return [
            'requires' => false,
            'reason' => 'Réservation simple'
        ];
    }

    /**
     * Vérifier si une réservation peut être annulée
     */
    public function canBeCancelled($reservation)
    {
        if (!in_array($reservation->statut, ['en_attente', 'confirmee'])) {
            return [
                'can_cancel' => false,
                'message' => 'Cette réservation ne peut pas être annulée'
            ];
        }

        $reservationDateTime = Carbon::parse($reservation->date_debut);

        // Adapter l'heure selon le créneau
        if ($reservation->creneau === 'matin') {
            $reservationDateTime->setTime(8, 0);
        } elseif ($reservation->creneau === 'apres-midi') {
            $reservationDateTime->setTime(14, 0);
        } else {
            $reservationDateTime->setTime(8, 0);
        }

        $hoursUntilReservation = now()->diffInHours($reservationDateTime, false);

        if ($hoursUntilReservation < 12) {
            return [
                'can_cancel' => false,
                'message' => 'Impossible d\'annuler moins de 12h avant le début',
                'hours_remaining' => $hoursUntilReservation
            ];
        }

        return [
            'can_cancel' => true,
            'message' => 'Annulation possible',
            'hours_remaining' => $hoursUntilReservation
        ];
    }

    /**
     * Vérifier le quota de réservations actives
     */
    public function checkUserQuota($userId, $maxReservations = 5)
    {
        $activeReservations = Reservation::where('user_id', $userId)
            ->whereIn('statut', ['en_attente', 'confirmee'])
            ->where('date_fin', '>=', now())
            ->count();

        if ($activeReservations >= $maxReservations) {
            return [
                'valid' => false,
                'message' => "Vous avez atteint la limite de {$maxReservations} réservations actives",
                'current_count' => $activeReservations,
                'max_allowed' => $maxReservations
            ];
        }

        return [
            'valid' => true,
            'message' => 'Quota disponible',
            'current_count' => $activeReservations,
            'remaining' => $maxReservations - $activeReservations
        ];
    }

    /**
     * Suggérer des locaux alternatifs
     */
    public function suggestAlternativeLocaux($siteId, $capaciteMin, $dateDebut, $dateFin, $creneau, $limit = 3)
    {
        $locaux = Local::where('site_id', $siteId)
            ->where('is_active', true)
            ->where('statut', 'disponible')
            ->where('capacite', '>=', $capaciteMin)
            ->get();

        $available = [];

        foreach ($locaux as $local) {
            if ($local->isAvailable($dateDebut, $dateFin, $creneau)) {
                $available[] = [
                    'id' => $local->id,
                    'nom' => $local->nom,
                    'capacite' => $local->capacite,
                    'equipements' => $local->equipements
                ];

                if (count($available) >= $limit) {
                    break;
                }
            }
        }

        return $available;
    }

    /**
     * Valider les dates
     */
    public function validateDates($dateDebut, $dateFin)
    {
        $start = Carbon::parse($dateDebut);
        $end = Carbon::parse($dateFin);
        $now = Carbon::now()->startOfDay();

        if ($start->lt($now)) {
            return [
                'valid' => false,
                'message' => 'La date de début doit être dans le futur'
            ];
        }

        if ($end->lt($start)) {
            return [
                'valid' => false,
                'message' => 'La date de fin doit être postérieure à la date de début'
            ];
        }

        // Limite à 90 jours dans le futur
        $maxDate = $now->copy()->addDays(90);
        if ($start->gt($maxDate)) {
            return [
                'valid' => false,
                'message' => 'Les réservations ne peuvent pas dépasser 90 jours dans le futur'
            ];
        }

        return [
            'valid' => true,
            'message' => 'Dates valides'
        ];
    }
}