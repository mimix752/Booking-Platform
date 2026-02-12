#!/bin/bash
# Script pour tester l'état de la base de données

cd "C:\Users\dell\PhpstormProjects\Booking-Platform\uca-booking-backend-1"

# Créer un script PHP pour interroger la base
cat > test_db.php << 'EOF'
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
EOF

php test_db.php

