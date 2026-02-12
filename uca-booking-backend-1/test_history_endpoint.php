<?php

// Script de test pour l'endpoint getHistory
require 'bootstrap/app.php';

$app = require_once 'bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);

// Simuler une requête
$request = \Illuminate\Http\Request::create(
    '/api/admin/reservations/history',
    'GET'
);

// Ajouter un token simulé
$user = \App\Models\User::first();
if ($user) {
    $request->setUserResolver(function () use ($user) {
        return $user;
    });
}

echo "Test de l'endpoint getHistory\n";
echo "==============================\n\n";

try {
    $controller = new \App\Http\Controllers\ReservationController();
    $response = $controller->getHistory($request);

    echo "✅ Succès!\n";
    echo json_encode(json_decode($response->getContent(), true), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} catch (\Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
    echo "Trace:\n";
    echo $e->getTraceAsString();
}

