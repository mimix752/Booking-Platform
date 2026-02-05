<?php

namespace App\Http\Controllers;

use App\Models\Local;
use App\Models\Log;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LocalController extends Controller
{
    /**
     * Récupérer tous les locaux actifs
     */
    public function index(Request $request)
    {
        try {
            $query = Local::active()->with('site');

            // Filtres
            if ($request->has('site_id')) {
                $query->where(function($q) use ($request) {
                    $q->where('site_id', $request->site_id)
                      ->orWhereHas('site', function($sq) use ($request) {
                          $sq->where('site_id', $request->site_id);
                      });
                });
            }

            if ($request->has('capacite_min')) {
                $query->minCapacity($request->capacite_min);
            }

            if ($request->has('statut')) {
                $query->where('statut', $request->statut);
            }

            $locaux = $query->orderBy('nom', 'asc')->get();

            return response()->json([
                'success' => true,
                'data' => $locaux
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des locaux'
            ], 500);
        }
    }

    /**
     * Récupérer un local par ID
     */
    public function show($id)
    {
        try {
            $local = Local::with('site')->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $local
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Local non trouvé'
            ], 404);
        }
    }

    /**
     * Vérifier la disponibilité d'un local
     */
    public function checkAvailability(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after_or_equal:date_debut',
            'creneau' => 'required|in:matin,apres-midi,journee-complete'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Paramètres invalides',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $local = Local::findOrFail($id);
            
            $isAvailable = $local->isAvailable(
                $request->date_debut,
                $request->date_fin,
                $request->creneau
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'available' => $isAvailable
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la vérification de disponibilité'
            ], 500);
        }
    }

    /**
     * Récupérer le calendrier d'un local
     */
    public function getCalendar(Request $request, $id)
    {
        try {
            $local = Local::findOrFail($id);
            
            $query = $local->reservations()
                ->whereIn('statut', ['confirmee', 'en_attente'])
                ->with('user:id,name,fonction');

            if ($request->has('start_date')) {
                $query->where('date_fin', '>=', $request->start_date);
            }

            if ($request->has('end_date')) {
                $query->where('date_debut', '<=', $request->end_date);
            }

            $reservations = $query->orderBy('date_debut', 'asc')->get();

            return response()->json([
                'success' => true,
                'data' => $reservations
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du calendrier'
            ], 500);
        }
    }

    /**
     * Créer un local (Admin)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'site_id' => 'required|exists:sites,id',
            'nom' => 'required|string|min:3|max:255',
            'capacite' => 'required|integer|min:1|max:1000',
            'equipements' => 'required|array',
            'statut' => 'in:disponible,occupé,maintenance',
            'contraintes' => 'nullable|string',
            'description' => 'nullable|string',
            'image_url' => 'nullable|url'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreurs de validation',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $local = Local::create($request->all());

            // Log de l'action
            Log::create([
                'user_id' => $request->user()->id,
                'action' => 'local_created',
                'entity_type' => 'local',
                'entity_id' => $local->id,
                'details' => [
                    'nom' => $local->nom,
                    'site_id' => $local->site_id,
                    'capacite' => $local->capacite
                ],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Local créé avec succès',
                'data' => $local->load('site')
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du local'
            ], 500);
        }
    }

    /**
     * Mettre à jour un local (Admin)
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|min:3|max:255',
            'capacite' => 'required|integer|min:1|max:1000',
            'equipements' => 'required|array',
            'statut' => 'in:disponible,occupé,maintenance',
            'contraintes' => 'nullable|string',
            'description' => 'nullable|string',
            'image_url' => 'nullable|url',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreurs de validation',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $local = Local::findOrFail($id);
            $local->update($request->all());

            // Log de l'action
            Log::create([
                'user_id' => $request->user()->id,
                'action' => 'local_updated',
                'entity_type' => 'local',
                'entity_id' => $local->id,
                'details' => [
                    'nom' => $local->nom,
                    'statut' => $local->statut
                ],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Local mis à jour avec succès',
                'data' => $local->load('site')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du local'
            ], 500);
        }
    }

    /**
     * Mettre un local en maintenance (Admin)
     */
    public function setMaintenance(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'maintenance' => 'required|boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Paramètres invalides',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $local = Local::findOrFail($id);
            $newStatus = $request->maintenance ? 'maintenance' : 'disponible';
            $local->update(['statut' => $newStatus]);

            // Log de l'action
            Log::create([
                'user_id' => $request->user()->id,
                'action' => $request->maintenance ? 'local_maintenance_on' : 'local_maintenance_off',
                'entity_type' => 'local',
                'entity_id' => $local->id,
                'details' => ['statut' => $newStatus],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);

            return response()->json([
                'success' => true,
                'message' => $request->maintenance ? 'Local mis en maintenance' : 'Local remis en service'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la modification du statut'
            ], 500);
        }
    }

    /**
     * Supprimer un local (Admin)
     */
    public function destroy(Request $request, $id)
    {
        try {
            $local = Local::findOrFail($id);

            // Vérifier s'il y a des réservations futures
            $futureReservations = $local->reservations()
                ->active()
                ->upcoming()
                ->count();

            if ($futureReservations > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer un local avec des réservations futures'
                ], 400);
            }

            $local->delete();

            // Log de l'action
            Log::create([
                'user_id' => $request->user()->id,
                'action' => 'local_deleted',
                'entity_type' => 'local',
                'entity_id' => $id,
                'details' => ['id' => $id],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Local supprimé avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression du local'
            ], 500);
        }
    }
}