<?php

namespace App\Services;

use App\Models\Reservation;
use App\Models\ReservationHistory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class ReservationHistoryService
{
    /**
     * Enregistrer une action dans l'historique
     *
     * @param Reservation $reservation
     * @param string $action
     * @param array|null $oldValues
     * @param array|null $newValues
     * @param string|null $raison
     * @param string|null $description
     * @return ReservationHistory
     */
    public static function record(
        Reservation $reservation,
        string $action,
        array $oldValues = null,
        array $newValues = null,
        string $raison = null,
        string $description = null
    ): ReservationHistory {
        $userId = Auth::id();
        $oldStatus = $oldValues['statut'] ?? null;
        $newStatus = $newValues['statut'] ?? null;

        return ReservationHistory::create([
            'reservation_id' => $reservation->id,
            'user_id' => $userId,
            'action' => $action,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'statut_ancien' => $oldStatus,
            'statut_nouveau' => $newStatus,
            'raison' => $raison,
            'ip_address' => Request::ip(),
            'user_agent' => Request::header('User-Agent'),
            'description' => $description
        ]);
    }

    /**
     * Enregistrer la création d'une réservation
     */
    public static function recordCreation(Reservation $reservation, $description = null)
    {
        return self::record(
            $reservation,
            'created',
            null,
            $reservation->getAttributes(),
            null,
            $description ?? 'Réservation créée'
        );
    }

    /**
     * Enregistrer la validation d'une réservation
     */
    public static function recordValidation(Reservation $reservation, $raison = null)
    {
        return self::record(
            $reservation,
            'validated',
            ['statut' => 'en_attente'],
            ['statut' => 'validee'],
            $raison,
            'Réservation validée'
        );
    }

    /**
     * Enregistrer le refus d'une réservation
     */
    public static function recordRefusal(Reservation $reservation, $raison = null)
    {
        return self::record(
            $reservation,
            'refused',
            ['statut' => 'en_attente'],
            ['statut' => 'refusee'],
            $raison,
            'Réservation refusée'
        );
    }

    /**
     * Enregistrer l'annulation d'une réservation
     */
    public static function recordCancellation(Reservation $reservation, $raison = null)
    {
        return self::record(
            $reservation,
            'cancelled',
            ['statut' => $reservation->statut],
            ['statut' => 'annulee'],
            $raison,
            'Réservation annulée'
        );
    }

    /**
     * Enregistrer une modification de réservation
     */
    public static function recordUpdate(Reservation $reservation, array $changes, $description = null)
    {
        $oldValues = [];
        $newValues = [];

        foreach ($changes as $field => $newValue) {
            $oldValues[$field] = $reservation->getOriginal($field);
            $newValues[$field] = $newValue;
        }

        return self::record(
            $reservation,
            'updated',
            $oldValues,
            $newValues,
            null,
            $description ?? 'Réservation modifiée'
        );
    }

    /**
     * Récupérer l'historique complet
     */
    public static function getReservationHistory(Reservation $reservation, $limit = 50)
    {
        return ReservationHistory::where('reservation_id', $reservation->id)
            ->with('user:id,name,email')
            ->orderBy('created_at', 'desc')
            ->paginate($limit);
    }

    /**
     * Récupérer l'historique de toutes les réservations (admin)
     */
    public static function getAllHistory($filters = [], $limit = 50)
    {
        $query = ReservationHistory::with([
            'reservation:id,user_id,local_id,statut',
            'reservation.user:id,name,email',
            'reservation.local:id,nom,site_id',
            'reservation.local.site:id,nom',
            'user:id,name,email'
        ]);

        // Filtres optionnels
        if (!empty($filters['reservation_id'])) {
            $query->where('reservation_id', $filters['reservation_id']);
        }

        if (!empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (!empty($filters['action'])) {
            $query->where('action', $filters['action']);
        }

        if (!empty($filters['site_id'])) {
            $query->whereHas('reservation.local.site', function ($q) use ($filters) {
                $q->where('sites.id', $filters['site_id']);
            });
        }

        if (!empty($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }

        return $query->orderBy('created_at', 'desc')->paginate($limit);
    }
}

