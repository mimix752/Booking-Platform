<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Models\Local;
use App\Models\BlackoutDate;
use App\Models\Log;
use App\Mail\ReservationCreated;
use App\Services\ReservationHistoryService;
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
            'motif' => 'nullable|string'
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

            // Enregistrer dans l'historique
            ReservationHistoryService::recordCreation(
                $reservation,
                'Réservation créée par l\'utilisateur'
            );

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

            // Enregistrer dans l'historique
            ReservationHistoryService::recordCancellation(
                $reservation,
                $request->cancellation_reason
            );

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

    /**
     * Récupérer l'historique des réservations traitées (confirmées, refusées, annulées)
     */
    public function getHistory(Request $request)
    {
        try {
            // Récupérer les paramètres de filtrage
            $limit = $request->get('limit', 50);
            $page = $request->get('page', 1);
            $statut = $request->get('statut');
            $site_id = $request->get('site_id');
            $date_from = $request->get('date_from');
            $date_to = $request->get('date_to');
            $search = $request->get('search');

            // Construire la requête
            $query = Reservation::with(['user', 'local.site', 'validator'])
                ->whereIn('statut', ['confirmee', 'refusee', 'annulee_utilisateur', 'annulee_admin']);

            // Filtrer par statut si spécifié
            if ($statut && in_array($statut, ['confirmee', 'refusee', 'annulee_utilisateur', 'annulee_admin'])) {
                $query->where('statut', $statut);
            }

            // Filtrer par site
            if ($site_id) {
                $query->whereHas('local', function ($q) use ($site_id) {
                    $q->where('site_id', $site_id);
                });
            }

            // Filtrer par plage de dates
            if ($date_from) {
                $query->where('date_debut', '>=', $date_from);
            }
            if ($date_to) {
                $query->where('date_fin', '<=', $date_to);
            }

            // Recherche textuelle
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->whereHas('user', function ($subQ) use ($search) {
                        $subQ->where('name', 'like', "%{$search}%")
                             ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->orWhereHas('local', function ($subQ) use ($search) {
                        $subQ->where('name', 'like', "%{$search}%");
                    })
                    ->orWhere('motif', 'like', "%{$search}%");
                });
            }

            // Trier par date décroissante (plus récentes en premier)
            $reservations = $query->orderBy('date_debut', 'desc')
                ->paginate($limit, ['*'], 'page', $page);

            // Transformer les données pour la réponse
            $data = $reservations->map(function ($reservation) {
                return [
                    'id' => $reservation->id,
                    'nom_demandeur' => $reservation->user?->name ?? 'N/A',
                    'email_demandeur' => $reservation->user?->email ?? 'N/A',
                    'salle' => $reservation->local?->name ?? 'N/A',
                    'lieu' => $reservation->local?->site?->name ?? 'N/A',
                    'date_debut' => $reservation->date_debut ? $reservation->date_debut->format('Y-m-d') : 'N/A',
                    'heure_debut' => $this->getHeureDebut($reservation->creneau),
                    'heure_fin' => $this->getHeureFin($reservation->creneau),
                    'raison' => $reservation->motif ?? 'N/A',
                    'type_reunion' => $reservation->nature_evenement ?? 'N/A',
                    'nombre_participants' => $reservation->participants_estimes ?? 0,
                    'status' => $reservation->statut ?? 'N/A',
                    'commentaire_admin' => $reservation->commentaire_admin,
                    'validated_by' => $reservation->validator?->name,
                    'validated_at' => $reservation->validated_at ? $reservation->validated_at->format('Y-m-d H:i:s') : null,
                    'cancelled_by' => null,
                    'cancelled_at' => $reservation->cancelled_at ? $reservation->cancelled_at->format('Y-m-d H:i:s') : null,
                    'cancellation_reason' => $reservation->cancellation_reason
                ];
            })->all();

            return response()->json([
                'success' => true,
                'data' => $data,
                'pagination' => [
                    'total' => $reservations->total(),
                    'page' => $reservations->currentPage(),
                    'limit' => $reservations->perPage(),
                    'totalPages' => $reservations->lastPage()
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in getHistory: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de l\'historique: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir l'heure de début selon le créneau
     */
    private function getHeureDebut($creneau)
    {
        return match ($creneau) {
            'matin' => '08:00',
            'apres-midi' => '14:00',
            'journee-complete' => '08:00',
            default => '08:00'
        };
    }

    /**
     * Obtenir l'heure de fin selon le créneau
     */
    private function getHeureFin($creneau)
    {
        return match ($creneau) {
            'matin' => '12:00',
            'apres-midi' => '18:00',
            'journee-complete' => '18:00',
            default => '18:00'
        };
    }
}
