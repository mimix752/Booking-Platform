<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\LocalController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SiteController;
use App\Http\Controllers\StatsController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Routes publiques
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/google-login', [AuthController::class, 'googleLogin']);
});

// Données publiques (lecture)
Route::get('/sites', [SiteController::class, 'index']);
Route::get('/sites/{id}', [SiteController::class, 'show']);
Route::get('/sites/{id}/locaux', [SiteController::class, 'getLocaux']);

Route::get('/locaux', [LocalController::class, 'index']);
Route::get('/locaux/{id}', [LocalController::class, 'show']);

// Routes protégées (nécessitent authentification)
Route::middleware(['auth:sanctum'])->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::get('/verify-token', [AuthController::class, 'verifyToken']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/refresh-token', [AuthController::class, 'refreshToken']);
    });

    // Locaux (actions protégées)
    Route::prefix('locaux')->group(function () {
        Route::post('/{id}/check-availability', [LocalController::class, 'checkAvailability']);
        Route::get('/{id}/calendar', [LocalController::class, 'getCalendar']);
    });

    // Réservations - Utilisateur
    Route::prefix('reservations')->group(function () {
        Route::post('/', [ReservationController::class, 'store']);
        Route::get('/my-reservations', [ReservationController::class, 'myReservations']);
        Route::get('/{id}', [ReservationController::class, 'show']);
        Route::post('/{id}/cancel', [ReservationController::class, 'cancel']);
    });

    // Historique des réservations (accessible à tous les utilisateurs authentifiés)
    Route::get('/admin/reservations/history', [ReservationController::class, 'getHistory']);

    // Profil utilisateur
    Route::prefix('profile')->group(function () {
        Route::get('/', [UserController::class, 'profile']);
        Route::put('/update', [UserController::class, 'updateProfile']);
    });

    // Routes Admin (nécessitent droits admin)
    Route::middleware(['check.admin'])->prefix('admin')->group(function () {

        // Gestion des sites
        Route::prefix('sites')->group(function () {
            Route::post('/', [SiteController::class, 'store']);
            Route::put('/{id}', [SiteController::class, 'update']);
            Route::delete('/{id}', [SiteController::class, 'destroy']);
        });

        // Gestion des locaux
        Route::prefix('locaux')->group(function () {
            Route::post('/', [LocalController::class, 'store']);
            Route::put('/{id}', [LocalController::class, 'update']);
            Route::post('/{id}/maintenance', [LocalController::class, 'setMaintenance']);
            Route::delete('/{id}', [LocalController::class, 'destroy']);
        });

        // Gestion des réservations
        Route::prefix('reservations')->group(function () {
            Route::get('/', [AdminController::class, 'getAllReservations']);
            Route::get('/pending', [AdminController::class, 'getPendingReservations']);
            Route::get('/history', [AdminController::class, 'getReservationHistory']);
            Route::get('/{id}/history', [AdminController::class, 'getReservationDetailHistory']);
            Route::post('/create', [AdminController::class, 'createAdminReservation']);
            Route::post('/{id}/validate', [AdminController::class, 'validateReservation']);
            Route::post('/{id}/refuse', [AdminController::class, 'refuseReservation']);
            Route::post('/{id}/cancel', [AdminController::class, 'cancelReservation']);
            Route::put('/{id}', [AdminController::class, 'updateReservation']);
        });

        // Backward-compatible hyphenated routes (some frontend builds request these)
        Route::get('/reservation-histories', [AdminController::class, 'getReservationHistory']);
        Route::get('/reservation-histories/{id}', [AdminController::class, 'getReservationDetailHistory']);

        // Gestion des utilisateurs
        Route::prefix('users')->group(function () {
            Route::get('/', [UserController::class, 'index']);
            Route::get('/{id}', [UserController::class, 'show']);
            Route::put('/{id}/role', [UserController::class, 'updateRole']);
            Route::post('/{id}/toggle-status', [UserController::class, 'toggleStatus']);
            Route::get('/{id}/history', [UserController::class, 'getHistory']);
            Route::delete('/{id}', [UserController::class, 'destroy']);
        });

        // Blackout dates
        Route::prefix('blackout-dates')->group(function () {
            Route::get('/', [AdminController::class, 'getBlackoutDates']);
            Route::post('/', [AdminController::class, 'addBlackoutDate']);
            Route::delete('/{id}', [AdminController::class, 'deleteBlackoutDate']);
        });

        // Statistiques et analytics
        Route::prefix('stats')->group(function () {
            Route::get('/dashboard-kpis', [StatsController::class, 'getDashboardKPIs']);
            Route::get('/top-locaux', [StatsController::class, 'getTopLocaux']);
            Route::get('/reservations-by-status', [StatsController::class, 'getReservationsByStatus']);
            Route::get('/monthly-activity', [StatsController::class, 'getMonthlyActivity']);
            Route::get('/by-site', [StatsController::class, 'getStatsBySite']);
            Route::get('/occupancy-rates', [StatsController::class, 'getOccupancyRates']);
            Route::get('/user-stats', [StatsController::class, 'getUserStats']);
            Route::get('/export-reservations', [StatsController::class, 'exportReservations']);
        });

        // Logs d'activité
        Route::get('/logs', [AdminController::class, 'getActivityLogs']);
    });
});

// Route de test (à supprimer en production)
Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'API UCA Booking fonctionne correctement',
        'version' => '1.0.0',
        'timestamp' => now()
    ]);
});

// Route 404 pour API
Route::fallback(function () {
    return response()->json([
        'success' => false,
        'message' => 'Endpoint non trouvé'
    ], 404);
});
