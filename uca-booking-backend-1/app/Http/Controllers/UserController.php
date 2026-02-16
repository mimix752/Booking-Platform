<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Log;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    /**
     * Récupérer tous les utilisateurs (Admin)
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->get('limit', 20);
            $query = User::query();

            // Filtres
            if ($request->has('role')) {
                $query->where('role', $request->role);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%")
                      ->orWhere('email', 'LIKE', "%{$search}%");
                });
            }

            $users = $query->orderBy('created_at', 'desc')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $users->items(),
                'pagination' => [
                    'total' => $users->total(),
                    'page' => $users->currentPage(),
                    'limit' => $users->perPage(),
                    'totalPages' => $users->lastPage()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des utilisateurs'
            ], 500);
        }
    }

    /**
     * Récupérer le profil utilisateur
     */
    public function profile(Request $request)
    {
        try {
            $user = $request->user();

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'google_id' => $user->google_id,
                    'email' => $user->email,
                    'name' => $user->name,
                    'picture' => $user->picture,
                    'fonction' => $user->fonction,
                    'role' => $user->role,
                    'created_at' => $user->created_at,
                    'last_login' => $user->last_login,
                    'active_reservations_count' => $user->active_reservations_count
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du profil'
            ], 500);
        }
    }

    /**
     * Mettre à jour le profil utilisateur
     */
    public function updateProfile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'fonction' => 'sometimes|in:Professeur,Personnel administratif,Chef de service,Chef de division,Directeur de pôle,Autre',
            'telephone' => 'sometimes|string|min:6|max:20'
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
            $fields = [];
            if ($request->has('fonction')) $fields['fonction'] = $request->fonction;
            if ($request->has('telephone')) $fields['telephone'] = $request->telephone;
            $user->update($fields);

            return response()->json([
                'success' => true,
                'message' => 'Profil mis à jour avec succès',
                'data' => $user
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du profil'
            ], 500);
        }
    }

    /**
     * Récupérer un utilisateur par ID (Admin)
     */
    public function show($id)
    {
        try {
            $user = User::with(['reservations' => function($query) {
                $query->latest()->limit(10);
            }])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $user
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé'
            ], 404);
        }
    }

    /**
     * Mettre à jour le rôle d'un utilisateur (Admin)
     */
    public function updateRole(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'role' => 'required|in:user,admin'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Rôle invalide',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $user = User::findOrFail($id);
            $user->update(['role' => $request->role]);

            // Log de l'action
            Log::create([
                'user_id' => $request->user()->id,
                'action' => 'user_role_updated',
                'entity_type' => 'user',
                'entity_id' => $id,
                'details' => ['new_role' => $request->role],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Rôle mis à jour avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du rôle'
            ], 500);
        }
    }

    /**
     * Activer/Désactiver un utilisateur (Admin)
     */
    public function toggleStatus(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);
            $newStatus = !$user->is_active;
            $user->update(['is_active' => $newStatus]);

            // Log de l'action
            Log::create([
                'user_id' => $request->user()->id,
                'action' => $newStatus ? 'user_activated' : 'user_deactivated',
                'entity_type' => 'user',
                'entity_id' => $id,
                'details' => ['is_active' => $newStatus],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);

            return response()->json([
                'success' => true,
                'message' => $newStatus ? 'Utilisateur activé avec succès' : 'Utilisateur désactivé avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la modification du statut'
            ], 500);
        }
    }

    /**
     * Récupérer l'historique d'un utilisateur (Admin)
     */
    public function getHistory($id)
    {
        try {
            $reservations = Reservation::with(['local.site'])
                ->where('user_id', $id)
                ->orderBy('created_at', 'desc')
                ->limit(50)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $reservations
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de l\'historique'
            ], 500);
        }
    }

    /**
     * Supprimer un utilisateur (Admin)
     */
    public function destroy(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);

            // Vérifier s'il y a des réservations actives
            $activeReservations = $user->reservations()
                ->active()
                ->upcoming()
                ->count();

            if ($activeReservations > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer un utilisateur avec des réservations actives'
                ], 400);
            }

            $user->delete();

            // Log de l'action
            Log::create([
                'user_id' => $request->user()->id,
                'action' => 'user_deleted',
                'entity_type' => 'user',
                'entity_id' => $id,
                'details' => ['id' => $id],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Utilisateur supprimé avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de l\'utilisateur'
            ], 500);
        }
    }
}