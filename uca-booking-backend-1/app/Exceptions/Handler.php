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
        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié'
            ], 401);
        }

        return parent::unauthenticated($request, $exception);
    }

    // ...existing code...
}

