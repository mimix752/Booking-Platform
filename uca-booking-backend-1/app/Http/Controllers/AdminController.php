<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Models\Local;
use App\Models\BlackoutDate;
use App\Models\Log;
use App\Mail\ReservationConfirmed;
use App\Mail\ReservationRefused;
use App\Mail\ReservationCancelled;
use App\Services\ReservationHistoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;


class AdminController extends Controller
{
    /**
     * Récupérer toutes les réservations (Admin)
     */
    public function getAllReservations(Request $request)
    {
        try {
            $perPage = $request->get('limit', 20);
            $query = Reservation::with(['user', 'local.site', 'validator']);

            // Filtres
            if ($request->has('status')) {
                $query->where('statut', $request->status);
            }

            if ($request->has('site_id')) {
                $query->whereHas('local', function($q) use ($request) {
                    $q->where('site_id', $request->site_id);
                });
            }

            if ($request->has('local_id')) {
                $query->where('local_id', $request->local_id);
            }

            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            if ($request->has('date_from')) {
                $query->where('date_debut', '>=', $request->date_from);
            }

            if ($request->has('date_to')) {
                $query->where('date_fin', '<=', $request->date_to);
            }

            if ($request->get('pending_only') === 'true') {
                $query->where('statut', 'en_attente');
            }

            $reservations = $query->orderBy('created_at', 'desc')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $reservations->items(),
                'pagination' => [
                    'total' => $reservations->total(),
                    'page' => $reservations->currentPage(),
                    'limit' => $reservations->perPage(),
                    'totalPages' => $reservations->lastPage()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des réservations'
            ], 500);
        }
    }

    /**
     * Récupérer les réservations en attente (Admin)
     */
    public function getPendingReservations(Request $request)
    {
        try {
            $perPage = $request->get('limit', 20);

            $query = Reservation::with(['user', 'local.site', 'validator'])
                ->pending();

            // Filtres (mêmes que getAllReservations, sans permettre status différent)
            if ($request->has('site_id')) {
                $query->whereHas('local', function ($q) use ($request) {
                    $q->where('site_id', $request->site_id);
                });
            }

            if ($request->has('local_id')) {
                $query->where('local_id', $request->local_id);
            }

            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            if ($request->has('date_from')) {
                $query->where('date_debut', '>=', $request->date_from);
            }

            if ($request->has('date_to')) {
                $query->where('date_fin', '<=', $request->date_to);
            }

            $reservations = $query->orderBy('created_at', 'desc')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $reservations->items(),
                'pagination' => [
                    'total' => $reservations->total(),
                    'page' => $reservations->currentPage(),
                    'limit' => $reservations->perPage(),
                    'totalPages' => $reservations->lastPage()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des réservations en attente'
            ], 500);
        }
    }

    /**
     * Valider une réservation
     */
    public function validateReservation(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'commentaire_admin' => 'nullable|string|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $reservation = Reservation::with(['user', 'local.site'])->findOrFail($id);

            if ($reservation->statut !== 'en_attente') {
                return response()->json([
                    'success' => false,
                    'message' => 'Seules les réservations en attente peuvent être validées'
                ], 400);
            }

            // Vérifier la disponibilité
            if (!$reservation->local->isAvailable(
                $reservation->date_debut,
                $reservation->date_fin,
                $reservation->creneau,
                $reservation->id
            )) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le créneau n\'est plus disponible'
                ], 400);
            }

            $reservation->update([
                'statut' => 'confirmee',
                'validated_by' => $request->user()->id,
                'validated_at' => now(),
                'commentaire_admin' => $request->commentaire_admin
            ]);

            // Enregistrer dans l'historique
            ReservationHistoryService::recordValidation(
                $reservation,
                $request->commentaire_admin
            );

            // Envoi de l'email de confirmation (ne doit pas empêcher la validation)
            try {
                Mail::to($reservation->user->email)->send(new ReservationConfirmed($reservation));
            } catch (\Throwable $mailException) {
                \Log::warning('Email confirmation reservation failed', [
                    'reservation_id' => $reservation->id,
                    'error' => $mailException->getMessage(),
                ]);
            }

            // Log de l'action
            Log::create([
                'user_id' => $request->user()->id,
                'action' => 'reservation_validated',
                'entity_type' => 'reservation',
                'entity_id' => $id,
                'details' => [
                    'reservation_id' => $id,
                    'user_id' => $reservation->user_id
                ],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Réservation validée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la validation de la réservation'
            ], 500);
        }
    }

    /**
     * Refuser une réservation
     */
    public function refuseReservation(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'commentaire_admin' => 'required|string|min:10|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $reservation = Reservation::with(['user', 'local.site'])->findOrFail($id);

            if (!in_array($reservation->statut, ['en_attente', 'confirmee'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette réservation ne peut pas être refusée'
                ], 400);
            }

            $reservation->update([
                'statut' => 'refusee',
                'validated_by' => $request->user()->id,
                'validated_at' => now(),
                'commentaire_admin' => $request->commentaire_admin
            ]);

            // Enregistrer dans l'historique
            ReservationHistoryService::recordRefusal(
                $reservation,
                $request->commentaire_admin
            );

            // Envoyer l'email de refus (ne doit pas casser l'API)
            try {
                Mail::to($reservation->user->email)->send(new ReservationRefused($reservation));
            } catch (\Throwable $mailException) {
                \Log::warning('Email refusal reservation failed', [
                    'reservation_id' => $reservation->id,
                    'error' => $mailException->getMessage(),
                ]);
            }

            // Log de l'action
            Log::create([
                'user_id' => $request->user()->id,
                'action' => 'reservation_refused',
                'entity_type' => 'reservation',
                'entity_id' => $id,
                'details' => [
                    'reservation_id' => $id,
                    'reason' => $request->commentaire_admin
                ],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Réservation refusée'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du refus de la réservation'
            ], 500);
        }
    }

    /**
     * Annuler une réservation (Admin)
     */
    public function cancelReservation(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'cancellation_reason' => 'required|string|min:10|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $reservation = Reservation::with(['user', 'local.site'])->findOrFail($id);

            if (!in_array($reservation->statut, ['en_attente', 'confirmee'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette réservation ne peut pas être annulée'
                ], 400);
            }

            $reservation->update([
                'statut' => 'annulee_admin',
                'cancelled_by' => $request->user()->id,
                'cancelled_at' => now(),
                'cancellation_reason' => $request->cancellation_reason,
                'commentaire_admin' => $request->cancellation_reason
            ]);

            // Enregistrer dans l'historique
            ReservationHistoryService::recordCancellation(
                $reservation,
                $request->cancellation_reason
            );

            // Envoyer l'email d'annulation (ne doit pas casser l'API)
            try {
                Mail::to($reservation->user->email)->send(new ReservationCancelled($reservation));
            } catch (\Throwable $mailException) {
                \Log::warning('Email cancellation reservation failed', [
                    'reservation_id' => $reservation->id,
                    'error' => $mailException->getMessage(),
                ]);
            }

            // Log de l'action
            Log::create([
                'user_id' => $request->user()->id,
                'action' => 'reservation_cancelled_admin',
                'entity_type' => 'reservation',
                'entity_id' => $id,
                'details' => [
                    'reservation_id' => $id,
                    'reason' => $request->cancellation_reason
                ],
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

    /**
     * Modifier une réservation (Admin)
     */
    public function updateReservation(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after_or_equal:date_debut',
            'creneau' => 'required|in:matin,apres-midi,journee-complete',
            'priorite' => 'nullable|in:normale,urgente,presidence',
            'commentaire_admin' => 'nullable|string|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $reservation = Reservation::findOrFail($id);

            // Vérifier la disponibilité
            if (!$reservation->local->isAvailable(
                $request->date_debut,
                $request->date_fin,
                $request->creneau,
                $reservation->id
            )) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le créneau n\'est pas disponible'
                ], 400);
            }

            // Capturer les changements avant la mise à jour
            $oldValues = $reservation->getAttributes();

            $reservation->update($request->all());

            // Enregistrer les changements dans l'historique
            $changes = [];
            foreach ($request->all() as $key => $value) {
                if (isset($oldValues[$key]) && $oldValues[$key] !== $value) {
                    $changes[$key] = $value;
                }
            }

            if (!empty($changes)) {
                ReservationHistoryService::recordUpdate(
                    $reservation,
                    $changes,
                    'Réservation modifiée par l\'administrateur'
                );
            }

            // Log de l'action
            Log::create([
                'user_id' => $request->user()->id,
                'action' => 'reservation_updated_admin',
                'entity_type' => 'reservation',
                'entity_id' => $id,
                'details' => $request->all(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Réservation modifiée avec succès',
                'data' => $reservation->load(['user', 'local.site'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la modification de la réservation'
            ], 500);
        }
    }

    /**
     * Créer une réservation administrative directe
     */
    public function createAdminReservation(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'local_id' => 'required|exists:locaux,id',
            'date_debut' => 'required|date|after_or_equal:today',
            'date_fin' => 'required|date|after_or_equal:date_debut',
            'creneau' => 'required|in:matin,apres-midi,journee-complete',
            'nature_evenement' => 'required|in:reunion,audience,convention,conference,congres',
            'participants_estimes' => 'required|integer|min:1|max:1000',
            'motif' => 'required|string|min:10|max:500',
            'priorite' => 'nullable|in:normale,urgente,presidence',
            'commentaire_admin' => 'nullable|string|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $local = Local::findOrFail($request->local_id);

            // Vérifier la disponibilité
            if (!$local->isAvailable($request->date_debut, $request->date_fin, $request->creneau)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce créneau est déjà réservé'
                ], 400);
            }

            $reservation = Reservation::create([
                'user_id' => $request->user_id,
                'local_id' => $request->local_id,
                'date_debut' => $request->date_debut,
                'date_fin' => $request->date_fin,
                'creneau' => $request->creneau,
                'nature_evenement' => $request->nature_evenement,
                'participants_estimes' => $request->participants_estimes,
                'motif' => $request->motif,
                'priorite' => $request->priorite ?? 'normale',
                'statut' => 'confirmee',
                'validated_by' => $request->user()->id,
                'validated_at' => now(),
                'commentaire_admin' => $request->commentaire_admin
            ]);

            // Enregistrer dans l'historique
            ReservationHistoryService::recordCreation(
                $reservation,
                'Réservation créée administrativement et directement confirmée'
            );

            // Log de l'action
            Log::create([
                'user_id' => $request->user()->id,
                'action' => 'admin_reservation_created',
                'entity_type' => 'reservation',
                'entity_id' => $reservation->id,
                'details' => [
                    'for_user_id' => $request->user_id,
                    'local_id' => $request->local_id
                ],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Réservation administrative créée avec succès',
                'data' => $reservation->load(['user', 'local.site'])
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la réservation'
            ], 500);
        }
    }

    /**
     * Gérer les blackout dates
     */
    public function getBlackoutDates(Request $request)
    {
        try {
            $query = BlackoutDate::with('creator');

            if ($request->has('upcoming') && $request->upcoming === 'true') {
                $query->upcoming();
            }

            if ($request->has('start_date') && $request->has('end_date')) {
                $query->byDateRange($request->start_date, $request->end_date);
            }

            $blackoutDates = $query->orderBy('date', 'asc')->get();

            return response()->json([
                'success' => true,
                'data' => $blackoutDates
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des dates bloquées'
            ], 500);
        }
    }

    /**
     * Ajouter un blackout date
     */
    public function addBlackoutDate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'date' => 'required|date|after_or_equal:today|unique:blackout_dates,date',
            'raison' => 'required|string|min:5|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $blackoutDate = BlackoutDate::create([
                'date' => $request->date,
                'raison' => $request->raison,
                'created_by' => $request->user()->id
            ]);

            // Log de l'action
            Log::create([
                'user_id' => $request->user()->id,
                'action' => 'blackout_date_created',
                'entity_type' => 'blackout_date',
                'entity_id' => $blackoutDate->id,
                'details' => [
                    'date' => $request->date,
                    'raison' => $request->raison
                ],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Date bloquée ajoutée avec succès',
                'data' => $blackoutDate
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'ajout de la date bloquée'
            ], 500);
        }
    }

    /**
     * Supprimer un blackout date
     */
    public function deleteBlackoutDate(Request $request, $id)
    {
        try {
            $blackoutDate = BlackoutDate::findOrFail($id);
            $blackoutDate->delete();

            // Log de l'action
            Log::create([
                'user_id' => $request->user()->id,
                'action' => 'blackout_date_deleted',
                'entity_type' => 'blackout_date',
                'entity_id' => $id,
                'details' => ['id' => $id],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Date bloquée supprimée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de la date bloquée'
            ], 500);
        }
    }

    /**
     * Récupérer l'historique des réservations
     */
    public function getReservationHistory(Request $request)
    {
        try {
            $filters = [];
            $limit = $request->get('limit', 50);

            // Filtres optionnels
            if ($request->has('reservation_id')) {
                $filters['reservation_id'] = $request->reservation_id;
            }

            if ($request->has('user_id')) {
                $filters['user_id'] = $request->user_id;
            }

            if ($request->has('action')) {
                $filters['action'] = $request->action;
            }

            if ($request->has('site_id')) {
                $filters['site_id'] = $request->site_id;
            }

            if ($request->has('date_from')) {
                $filters['date_from'] = $request->date_from;
            }

            if ($request->has('date_to')) {
                $filters['date_to'] = $request->date_to;
            }

            $history = \App\Services\ReservationHistoryService::getAllHistory($filters, $limit);

            // Normalize items: add 'nom_demandeur' for frontend convenience
            $items = collect($history->items())->map(function ($h) {
                $item = $h->toArray();

                // Reservation-level defaults
                $reservation = $h->reservation ?? null;
                $resUser = $reservation && $reservation->user ? $reservation->user : null;
                $resLocal = $reservation && $reservation->local ? $reservation->local : null;
                $resSite = $resLocal && $resLocal->site ? $resLocal->site : null;

                // Determine requester name/email
                $nomDemandeur = '';
                if ($reservation && !empty($resUser->name)) {
                    $nomDemandeur = $resUser->name;
                } elseif (!empty($h->user) && !empty($h->user->name)) {
                    $nomDemandeur = $h->user->name;
                }

                $emailDemandeur = '';
                if ($reservation && !empty($resUser->email)) {
                    $emailDemandeur = $resUser->email;
                } elseif (!empty($h->user) && !empty($h->user->email)) {
                    $emailDemandeur = $h->user->email;
                }

                // Preserve original objects
                $item['user_obj'] = $item['user'] ?? null;
                $item['reservation_obj'] = $item['reservation'] ?? null;

                // Overwrite top-level user with the requester's name string (frontend expects string)
                $item['user'] = $nomDemandeur;
                $item['nom_demandeur'] = $nomDemandeur;
                $item['email_demandeur'] = $emailDemandeur;

                // Reservation fields (flattened) - use reservation if present, else try new_values/old_values (safe via data_get)
                $item['date_debut'] = $reservation->date_debut ?? (data_get($item, 'new_values.date_debut') ?? data_get($item, 'old_values.date_debut'));
                $item['date_fin'] = $reservation->date_fin ?? (data_get($item, 'new_values.date_fin') ?? data_get($item, 'old_values.date_fin'));
                $item['creneau'] = $reservation->creneau ?? (data_get($item, 'new_values.creneau') ?? data_get($item, 'old_values.creneau'));
                $item['nature_evenement'] = $reservation->nature_evenement ?? (data_get($item, 'new_values.nature_evenement') ?? null);
                $item['participants_estimes'] = $reservation->participants_estimes ?? (data_get($item, 'new_values.participants_estimes') ?? null);
                $item['motif'] = $reservation->motif ?? (data_get($item, 'new_values.motif') ?? null);
                $item['statut'] = $reservation->statut ?? (data_get($item, 'new_values.statut') ?? (data_get($item, 'old_values.statut') ?? null));
                $item['commentaire_admin'] = $reservation->commentaire_admin ?? (data_get($item, 'new_values.commentaire_admin') ?? null);

                // Local/site fields
                $item['local_id'] = $reservation->local_id ?? (data_get($item, 'new_values.local_id') ?? null);
                $item['local_nom'] = $resLocal->nom ?? (data_get($item, 'new_values.local_nom') ?? ($resLocal->name ?? null));
                $item['site_id'] = $resSite->id ?? ($resLocal->site_id ?? (data_get($item, 'new_values.site_id') ?? null));
                $item['site_nom'] = $resSite->nom ?? ($resSite->name ?? null);

                // Provide aliases the frontend expects
                $item['local'] = $item['local'] ?? $item['local_nom'] ?? ($resLocal->nom ?? null);
                $item['salle'] = $item['salle'] ?? $item['local'];
                $item['site'] = $item['site'] ?? $item['site_nom'] ?? ($resSite->nom ?? null);
                $item['lieu'] = $item['lieu'] ?? $item['site'];

                // Date/time aliases
                $item['date'] = $item['date'] ?? $item['date_debut'] ?? null;
                // Compute heureDebut/heureFin from creneau if possible
                $heureDebut = $item['heure_debut'] ?? null;
                $heureFin = $item['heure_fin'] ?? null;
                if (empty($heureDebut) && !empty($item['creneau'])) {
                    if ($item['creneau'] === 'matin') {
                        $heureDebut = '08:00'; $heureFin = '12:00';
                    } elseif ($item['creneau'] === 'apres-midi') {
                        $heureDebut = '14:00'; $heureFin = '18:00';
                    } elseif ($item['creneau'] === 'journee-complete') {
                        $heureDebut = '08:00'; $heureFin = '18:00';
                    }
                }
                $item['heure_debut'] = $item['heure_debut'] ?? $heureDebut;
                $item['heureDebut'] = $item['heureDebut'] ?? $item['heure_debut'];
                $item['heure_fin'] = $item['heure_fin'] ?? $heureFin;
                $item['heureFin'] = $item['heureFin'] ?? $item['heure_fin'];

                // Event / motif aliases
                $item['event'] = $item['event'] ?? $item['nature_evenement'] ?? null;
                $item['type_reunion'] = $item['type_reunion'] ?? $item['event'];
                // provide raison as alias for motif
                $item['motif'] = $item['motif'] ?? null;
                $item['raison'] = $item['raison'] ?? $item['motif'];

                // Participants aliases
                $item['participants_estimes'] = $item['participants_estimes'] ?? $item['participants_estimes'] ?? null;
                $item['participants'] = $item['participants'] ?? $item['participants_estimes'] ?? (data_get($item, 'new_values.participants') ?? null) ?? $item['nombre_participants'] ?? null;
                $item['nombre_participants'] = $item['nombre_participants'] ?? $item['participants'];

                // Commentaire aliases
                $item['commentaire_admin'] = $item['commentaire_admin'] ?? null;
                $item['commentaire'] = $item['commentaire'] ?? $item['commentaire_admin'] ?? null;

                // Status/status alias
                $item['statut'] = $item['statut'] ?? ($item['status'] ?? null);
                // Normalize to English keys for frontend ('confirmed','refused','cancelled')
                $statutLower = is_string($item['statut']) ? strtolower($item['statut']) : '';
                $normalized = null;
                if (in_array($statutLower, ['confirmee', 'confirmée', 'confirmée', 'confirmé', 'confirme', 'confirmed', 'confirm'])) {
                    $normalized = 'confirmed';
                } elseif (in_array($statutLower, ['refusee', 'refusée', 'refused', 'refuse'])) {
                    $normalized = 'refused';
                } elseif (in_array($statutLower, ['annulee_admin', 'annulee_utilisateur', 'annulée', 'annulee', 'annule', 'cancelled', 'annulee_admin', 'annulee'])) {
                    $normalized = 'cancelled';
                } elseif ($statutLower === 'en_attente' || $statutLower === 'pending') {
                    $normalized = 'pending';
                } else {
                    // fallback: use original as-is
                    $normalized = $item['statut'];
                }
                $item['status'] = $item['status'] ?? $normalized;

                // Keep created_at (history timestamp)
                $item['history_created_at'] = $h->created_at ?? $item['created_at'] ?? null;

                return $item;
            })->all();

            return response()->json([
                'success' => true,
                'data' => $items,
                'pagination' => [
                    'total' => $history->total(),
                    'page' => $history->currentPage(),
                    'limit' => $history->perPage(),
                    'totalPages' => $history->lastPage()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de l\'historique des réservations: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer l'historique d'une réservation spécifique
     */
    public function getReservationDetailHistory(Request $request, $reservationId)
    {
        try {
            $reservation = Reservation::findOrFail($reservationId);
            $limit = $request->get('limit', 50);

            $history = \App\Services\ReservationHistoryService::getReservationHistory($reservation, $limit);

            return response()->json([
                'success' => true,
                'data' => $history->items(),
                'pagination' => [
                    'total' => $history->total(),
                    'page' => $history->currentPage(),
                    'limit' => $history->perPage(),
                    'totalPages' => $history->lastPage()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de l\'historique: ' . $e->getMessage()
            ], 404);
        }
    }

    /**
     * Récupérer les logs d'activité
     */
    public function getActivityLogs(Request $request)
    {
        try {
            $perPage = $request->get('limit', 50);
            $query = Log::with('user');

            // Filtres
            if ($request->has('user_id')) {
                $query->byUser($request->user_id);
            }

            if ($request->has('action')) {
                $query->byAction($request->action);
            }

            if ($request->has('entity_type')) {
                $query->byEntity($request->entity_type, $request->entity_id);
            }

            if ($request->has('days')) {
                $query->recent($request->days);
            }

            $logs = $query->orderBy('created_at', 'desc')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $logs->items(),
                'pagination' => [
                    'total' => $logs->total(),
                    'page' => $logs->currentPage(),
                    'limit' => $logs->perPage(),
                    'totalPages' => $logs->lastPage()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des logs'
            ], 500);
        }
    }
}

