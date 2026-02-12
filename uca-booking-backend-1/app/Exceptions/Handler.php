<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;

class Handler extends ExceptionHandler
{
    // ...existing code...

    /**
     * Convertit les unauthorized API en réponse JSON au lieu d'une redirection vers route('login').
     */
    protected function unauthenticated($request, \Illuminate\Auth\AuthenticationException $exception)
    {
        // Robust detection for API requests: Accept header, ajax, path segment 'api' or route pattern
        $acceptHeader = (string) $request->header('Accept');
        $isApiPath = $request->is('api/*') || $request->segment(1) === 'api';
        $wantsJson = $request->expectsJson() || $request->wantsJson() || $request->ajax() || str_contains($acceptHeader, 'application/json');

        if ($wantsJson || $isApiPath) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié'
            ], 401);
        }

        return parent::unauthenticated($request, $exception);
    }

    // ...existing code...
}
