<?php

namespace App\Http\Controllers;

use App\Models\Site;
use App\Models\Log;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SiteController extends Controller
{
    /**
     * Récupérer tous les sites actifs
     */
    public function index(Request $request)
    {
        try {
            $sites = Site::active()
                ->orderBy('nom', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $sites
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des sites'
            ], 500);
        }
    }

    /**
     * Récupérer un site par ID
     */
    public function show($id)
    {
        try {
            $site = Site::where('id', $id)
                ->orWhere('site_id', $id)
                ->first();

            if (!$site) {
                return response()->json([
                    'success' => false,
                    'message' => 'Site non trouvé'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $site
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du site'
            ], 500);
        }
    }

    /**
     * Créer un nouveau site (Admin)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'site_id' => 'required|string|unique:sites,site_id|regex:/^[a-z0-9-]+$/',
            'nom' => 'required|string|min:3|max:255',
            'adresse' => 'nullable|string',
            'description' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreurs de validation',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $site = Site::create($request->all());

            // Log de l'action
            Log::create([
                'user_id' => $request->user()->id,
                'action' => 'site_created',
                'entity_type' => 'site',
                'entity_id' => $site->id,
                'details' => [
                    'site_id' => $site->site_id,
                    'nom' => $site->nom
                ],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Site créé avec succès',
                'data' => $site
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du site'
            ], 500);
        }
    }

    /**
     * Mettre à jour un site (Admin)
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|min:3|max:255',
            'adresse' => 'nullable|string',
            'description' => 'nullable|string',
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
            $site = Site::findOrFail($id);
            $site->update($request->all());

            // Log de l'action
            Log::create([
                'user_id' => $request->user()->id,
                'action' => 'site_updated',
                'entity_type' => 'site',
                'entity_id' => $site->id,
                'details' => [
                    'nom' => $site->nom,
                    'is_active' => $site->is_active
                ],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Site mis à jour avec succès',
                'data' => $site
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du site'
            ], 500);
        }
    }

    /**
     * Supprimer un site (Admin)
     */
    public function destroy(Request $request, $id)
    {
        try {
            $site = Site::findOrFail($id);

            // Vérifier s'il y a des locaux associés
            if ($site->locaux()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer un site contenant des locaux'
                ], 400);
            }

            $site->delete();

            // Log de l'action
            Log::create([
                'user_id' => $request->user()->id,
                'action' => 'site_deleted',
                'entity_type' => 'site',
                'entity_id' => $id,
                'details' => ['id' => $id],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Site supprimé avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression du site'
            ], 500);
        }
    }

    /**
     * Récupérer les locaux d'un site
     */
    public function getLocaux($id)
    {
        try {
            $site = Site::where('id', $id)
                ->orWhere('site_id', $id)
                ->firstOrFail();

            $locaux = $site->locaux()
                ->active()
                ->with('site')
                ->orderBy('nom', 'asc')
                ->get();

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
}