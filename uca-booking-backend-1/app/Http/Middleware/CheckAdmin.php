<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckAdmin
{
    /**
     * Vérifier si l'utilisateur est administrateur
     */
    public function handle(Request $request, Closure $next)
    {
        if (!$request->user() || !$request->user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé. Droits administrateur requis.'
            ], 403);
        }

        return $next($request);
    }
}