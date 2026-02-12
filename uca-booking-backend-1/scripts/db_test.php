<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $count = \App\Models\ReservationHistory::count();
    echo "ReservationHistory count: $count\n";
    $rows = \App\Models\ReservationHistory::limit(3)->get();
    foreach ($rows as $r) {
        echo json_encode($r->toArray()) . "\n";
    }
} catch (Throwable $e) {
    echo get_class($e) . ': ' . $e->getMessage() . "\n";
}

