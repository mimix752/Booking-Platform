<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class RateLimitMiddleware
{
    /**
     * Limite de taux pour prévenir les abus
     */
    public function handle(Request $request, Closure $next, $maxAttempts = 60, $decayMinutes = 1)
    {
        $key = $this->resolveRequestSignature($request);
        
        if (Cache::has($key)) {
            $attempts = Cache::get($key);
            
            if ($attempts >= $maxAttempts) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trop de requêtes. Veuillez réessayer dans quelques instants.'
                ], 429);
            }
            
            Cache::put($key, $attempts + 1, now()->addMinutes($decayMinutes));
        } else {
            Cache::put($key, 1, now()->addMinutes($decayMinutes));
        }

        return $next($request);
    }

    /**
     * Générer une signature unique pour la requête
     */
    protected function resolveRequestSignature(Request $request)
    {
        if ($user = $request->user()) {
            return sha1('rate_limit|' . $user->id);
        }

        return sha1('rate_limit|' . $request->ip());
    }
}