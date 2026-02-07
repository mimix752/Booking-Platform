<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Models\Local;
use App\Models\BlackoutDate;
use App\Models\Log;
use App\Mail\ReservationCreated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;

class ReservationController extends Controller
{
    /**
     * Créer une réservation
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'local_id' => 'required|exists:locaux,id',
            'date_debut' => 'required|date|after_or_equal:today',
            'date_fin' => 'required|date|after_or_equal:date_debut',
            'creneau' => 'required|in:matin,apres-midi,journee-complete',
            'nature_evenement' => 'required|in:reunion,audience,convention,conference,congres',
            'participants_estimes' => 'required|integer|min:1|max:1000',
            'motif' => 'required|string|min:10|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreurs de validation',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $user = $request->user();

            // Vérifier le nombre de réservations actives
            $maxReservations = env('MAX_RESERVATIONS_PER_USER', 5);
            if ($user->active_reservations_count >= $maxReservations) {
                return response()->json([
                    'success' => false,
                    'message' => "Vous avez atteint la limite de {$maxReservations} réservations actives"
                ], 400);
            }

            // Vérifier si c'est un jour blackout
            if (BlackoutDate::isBlackout($request->date_debut)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette date n\'est pas disponible pour les réservations'
                ], 400);
            }

            $local = Local::findOrFail($request->local_id);

            // Vérifier la disponibilité
            if (!$local->isAvailable($request->date_debut, $request->date_fin, $request->creneau)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce créneau est déjà réservé'
                ], 400);
            }

            // Créer la réservation
            $reservation = new Reservation($request->all());
            $reservation->user_id = $user->id;

            // Déterminer le statut
            if ($reservation->requiresValidation()) {
                $reservation->statut = 'en_attente';
            } else {
                $reservation->statut = 'confirmee';
            }

            $reservation->save();

            // Envoyer l'email de confirmation
            Mail::to($user->email)->send(new ReservationCreated($reservation));

            // Log de l'action
            Log::create([
                'user_id' => $user->id,
                'action' => 'reservation_created',
                'entity_type' => 'reservation',
                'entity_id' => $reservation->id,
                'details' => [
                    'local_id' => $reservation->local_id,
                    'date_debut' => $reservation->date_debut,
                    'statut' => $reservation->statut
                ],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Réservation créée avec succès',
                'data' => [
                    'id' => $reservation->id,
                    'statut' => $reservation->statut,
                    'needsValidation' => $reservation->statut === 'en_attente'
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la réservation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer mes réservations
     */
    public function myReservations(Request $request)
    {
        try {
            $query = Reservation::with(['local.site', 'validator'])
                ->where('user_id', $request->user()->id);

            if ($request->has('status')) {
                $query->byStatus($request->status);
            }

            if ($request->get('upcoming') === 'true') {
                $query->upcoming();
            }

            $reservations = $query->orderBy('date_debut', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $reservations
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des réservations'
            ], 500);
        }
    }

    /**
     * Récupérer une réservation par ID
     */
    public function show(Request $request, $id)
    {
        try {
            $query = Reservation::with(['local.site', 'user', 'validator']);

            // Si non-admin, vérifier que c'est sa réservation
            if (!$request->user()->isAdmin()) {
                $query->where('user_id', $request->user()->id);
            }

            $reservation = $query->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $reservation
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Réservation non trouvée'
            ], 404);
        }
    }

    /**
     * Annuler une réservation
     */
    public function cancel(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'cancellation_reason' => 'nullable|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $reservation = Reservation::where('id', $id)
                ->where('user_id', $request->user()->id)
                ->firstOrFail();

            if (!in_array($reservation->statut, ['en_attente', 'confirmee'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette réservation ne peut pas être annulée'
                ], 400);
            }

            if (!$reservation->canBeCancelled()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible d\'annuler moins de 12h avant le début'
                ], 400);
            }

            $reservation->update([
                'statut' => 'annulee_utilisateur',
                'cancelled_by' => $request->user()->id,
                'cancelled_at' => now(),
                'cancellation_reason' => $request->cancellation_reason
            ]);

            // Log de l'action
            Log::create([
                'user_id' => $request->user()->id,
                'action' => 'reservation_cancelled_user',
                'entity_type' => 'reservation',
                'entity_id' => $id,
                'details' => ['reason' => $request->cancellation_reason],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Réservation annulée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'annulation de la réservation'
            ], 500);
        }
    }
}