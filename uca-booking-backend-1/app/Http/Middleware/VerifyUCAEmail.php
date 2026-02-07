<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class VerifyUCAEmail
{
    /**
     * Vérifier que l'email est bien du domaine UCA
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non authentifié'
            ], 401);
        }

        $allowedDomains = ['@uca.ma', '@uca.ac.ma'];
        $isValidDomain = false;
        
        foreach ($allowedDomains as $domain) {
            if (str_ends_with($user->email, $domain)) {
                $isValidDomain = true;
                break;
            }
        }

        if (!$isValidDomain) {
            return response()->json([
                'success' => false,
                'message' => 'Email non autorisé. Seuls les emails @uca.ma et @uca.ac.ma sont acceptés.'
            ], 403);
        }

        return $next($request);
    }
}