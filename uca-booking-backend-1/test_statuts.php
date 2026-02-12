<?php
// Vérifier les statuts réels en base de données
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';

$reservations = \App\Models\Reservation::select('statut')->distinct()->get();

echo "Statuts trouvés en base de données:\n";
echo "===================================\n";
foreach ($reservations as $r) {
    echo "- " . $r->statut . "\n";
}

echo "\nNombre total de réservations: " . \App\Models\Reservation::count() . "\n";
echo "\nRéservations par statut:\n";
$stats = \App\Models\Reservation::select('statut')->selectRaw('count(*) as count')->groupBy('statut')->get();
foreach ($stats as $stat) {
    echo "- {$stat->statut}: {$stat->count}\n";
}

// Test de la requête getHistory
echo "\n\nTest de l'endpoint getHistory:\n";
echo "==============================\n";

try {
    $query = \App\Models\Reservation::with(['user', 'local.site', 'validator'])
        ->whereIn('statut', ['confirmee', 'refusee', 'annulee_utilisateur', 'annulee_admin']);

    $count = $query->count();
    echo "✅ Requête valide!\n";
    echo "Nombre de réservations correspondantes: " . $count . "\n";

    // Afficher un exemple
    $example = $query->first();
    if ($example) {
        echo "\nExemple de réservation:\n";
        echo json_encode([
            'id' => $example->id,
            'user' => $example->user?->name,
            'local' => $example->local?->name,
            'statut' => $example->statut
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }
} catch (\Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
    echo "Trace:\n";
    echo $e->getTraceAsString();
}

