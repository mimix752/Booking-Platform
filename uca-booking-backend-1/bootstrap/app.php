<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Enable CORS for API
        $middleware->append(\Illuminate\Http\Middleware\HandleCors::class);

        // For API-only apps avoid redirecting unauthenticated users to a non-existing web "login" route.
        $middleware->redirectGuestsTo(fn () => null);

        // Register route middleware aliases
        $middleware->alias([
            'check.admin' => \App\Http\Middleware\CheckAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
