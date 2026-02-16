<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Log;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log as LaravelLog;
use Illuminate\Support\Facades\Hash;
use Google_Client;
use GuzzleHttp\Client;

class AuthController extends Controller
{
    /**
     * Inscription avec email/mot de passe
     */
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:10|max:255',
            'fonction' => 'nullable|string|max:255',
        ]);

        // Optionnel: limiter au domaine UCA
        $email = $request->email;
        $allowedDomains = explode(',', (string) config('services.allowed_domains', '@uca.ma,@uca.ac.ma'));
        $isValidDomain = false;
        foreach ($allowedDomains as $domain) {
            $domain = trim($domain);
            if ($domain !== '' && str_ends_with($email, $domain)) {
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

        try {
            $user = User::create([
                'name' => $request->name,
                'email' => $email,
                'password' => Hash::make($request->password),
                'fonction' => $request->fonction,
                'role' => 'user',
                'is_active' => true,
                'last_login' => now(),
            ]);

            $token = $user->createToken('auth_token')->plainTextToken;

            Log::create([
                'user_id' => $user->id,
                'action' => 'user_registered',
                'entity_type' => 'user',
                'entity_id' => $user->id,
                'details' => ['email' => $user->email],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Compte créé avec succès',
                'data' => [
                    'token' => $token,
                    'user' => [
                        'id' => $user->id,
                        'email' => $user->email,
                        'name' => $user->name,
                        'picture' => $user->picture,
                        'role' => $user->role,
                        'fonction' => $user->fonction,
                        'telephone' => $user->telephone,
                    ]
                ]
            ], 201);
        } catch (\Exception $e) {
            LaravelLog::error('Register failed', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du compte: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Login email/mot de passe
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        try {
            $user = User::where('email', $request->email)->first();

            if (!$user || !Hash::check($request->password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Identifiants invalides'
                ], 401);
            }

            if (!$user->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Votre compte a été désactivé. Contactez l\'administrateur.'
                ], 403);
            }

            $user->update(['last_login' => now()]);

            $token = $user->createToken('auth_token')->plainTextToken;

            Log::create([
                'user_id' => $user->id,
                'action' => 'user_login_password',
                'entity_type' => 'user',
                'entity_id' => $user->id,
                'details' => ['email' => $user->email],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
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
                        'fonction' => $user->fonction,
                        'telephone' => $user->telephone,
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            LaravelLog::error('Password login failed', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'authentification: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Connexion avec Google OAuth2
     */
    public function googleLogin(Request $request)
    {
        $request->validate([
            'token' => 'required|string'
        ]);

        try {
            $googleClientId = (string) config('services.google.client_id');
            if (!$googleClientId) {
                return response()->json([
                    'success' => false,
                    'message' => 'GOOGLE_CLIENT_ID non configuré dans le backend (.env)'
                ], 500);
            }

            // Vérifier le token Google
            $client = new Google_Client(['client_id' => $googleClientId]);

            // Configure SSL verification based on environment
            $verifySsl = config('services.google.verify_ssl', true);
            $httpClient = new \GuzzleHttp\Client([
                'verify' => $verifySsl,
                'http_errors' => false,
            ]);
            $client->setHttpClient($httpClient);

            $payload = $client->verifyIdToken($request->token);

            if (!$payload) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token Google invalide'
                ], 401);
            }

            // Vérifier le domaine email
            $email = $payload['email'];
            $allowedDomains = explode(',', (string) config('services.allowed_domains', '@uca.ma,@uca.ac.ma'));

            $isValidDomain = false;
            foreach ($allowedDomains as $domain) {
                $domain = trim($domain);
                if ($domain !== '' && str_ends_with($email, $domain)) {
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
                    'password' => null,  // Google users don't have password
                    'fonction' => null,  // Google users don't have fonction by default
                    'role' => 'user',
                    'is_active' => true,
                    'last_login' => now()
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
                    'google_id' => $payload['sub'],  // Ensure google_id is set even for existing users
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
                        'fonction' => $user->fonction,
                        'telephone' => $user->telephone
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            LaravelLog::error('Google login failed', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

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
                'fonction' => $user->fonction,
                'telephone' => $user->telephone
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

