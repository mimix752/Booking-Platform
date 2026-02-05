<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Log;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Google_Client;

class AuthController extends Controller
{
    /**
     * Connexion avec Google OAuth2
     */
    public function googleLogin(Request $request)
    {
        $request->validate([
            'token' => 'required|string'
        ]);

        try {
            // Vérifier le token Google
            $client = new Google_Client(['client_id' => env('GOOGLE_CLIENT_ID')]);
            $payload = $client->verifyIdToken($request->token);

            if (!$payload) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token Google invalide'
                ], 401);
            }

            // Vérifier le domaine email
            $email = $payload['email'];
            $allowedDomains = explode(',', env('ALLOWED_DOMAINS', '@uca.ma,@uca.ac.ma'));
            
            $isValidDomain = false;
            foreach ($allowedDomains as $domain) {
                if (str_ends_with($email, $domain)) {
                    $isValidDomain = true;
                    break;
                }
            }

            if (!$isValidDomain) {
                return response()->json([
                    'success' => false,
                    'message' => 'Domaine email non autorisé. Utilisez un email @uca.ma ou @uca.ac.ma'
                ], 403);
            }

            // Trouver ou créer l'utilisateur
            $user = User::where('google_id', $payload['sub'])
                       ->orWhere('email', $email)
                       ->first();

            if (!$user) {
                $user = User::create([
                    'google_id' => $payload['sub'],
                    'email' => $email,
                    'name' => $payload['name'],
                    'picture' => $payload['picture'] ?? null,
                    'role' => 'user',
                    'is_active' => true
                ]);
            } else {
                // Vérifier si le compte est actif
                if (!$user->is_active) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Votre compte a été désactivé. Contactez l\'administrateur.'
                    ], 403);
                }

                // Mettre à jour les infos
                $user->update([
                    'picture' => $payload['picture'] ?? $user->picture,
                    'last_login' => now()
                ]);
            }

            // Créer un token d'accès
            $token = $user->createToken('auth_token')->plainTextToken;

            // Log de connexion
            Log::create([
                'user_id' => $user->id,
                'action' => 'user_login',
                'entity_type' => 'user',
                'entity_id' => $user->id,
                'details' => ['email' => $user->email],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Connexion réussie',
                'data' => [
                    'token' => $token,
                    'user' => [
                        'id' => $user->id,
                        'email' => $user->email,
                        'name' => $user->name,
                        'picture' => $user->picture,
                        'role' => $user->role,
                        'fonction' => $user->fonction
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'authentification: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Vérifier le token
     */
    public function verifyToken(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'picture' => $user->picture,
                'role' => $user->role,
                'fonction' => $user->fonction
            ]
        ]);
    }

    /**
     * Déconnexion
     */
    public function logout(Request $request)
    {
        // Log de déconnexion
        Log::create([
            'user_id' => $request->user()->id,
            'action' => 'user_logout',
            'entity_type' => 'user',
            'entity_id' => $request->user()->id,
            'details' => ['email' => $request->user()->email],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent()
        ]);

        // Supprimer le token actuel
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Déconnexion réussie'
        ]);
    }

    /**
     * Rafraîchir le token
     */
    public function refreshToken(Request $request)
    {
        $user = $request->user();

        // Supprimer l'ancien token
        $request->user()->currentAccessToken()->delete();

        // Créer un nouveau token
        $newToken = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $newToken,
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'name' => $user->name,
                    'picture' => $user->picture,
                    'role' => $user->role,
                    'fonction' => $user->fonction
                ]
            ]
        ]);
    }
}