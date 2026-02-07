<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Redirection vers la documentation API ou page d'accueil
Route::get('/', function () {
    return response()->json([
        'application' => 'UCA Booking API',
        'version' => '1.0.0',
        'description' => 'API REST pour la gestion des réservations de locaux - Université Cadi Ayyad',
        'documentation' => '/api/documentation',
        'endpoints' => [
            'auth' => '/api/auth/*',
            'sites' => '/api/sites',
            'locaux' => '/api/locaux',
            'reservations' => '/api/reservations',
            'admin' => '/api/admin/*',
        ],
        'status' => 'operational'
    ]);
});

// Health check endpoint
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'timestamp' => now(),
        'database' => DB::connection()->getDatabaseName(),
        'environment' => app()->environment()
    ]);
});

// Documentation API (optionnel)
Route::get('/api/documentation', function () {
    return view('api-documentation');
});