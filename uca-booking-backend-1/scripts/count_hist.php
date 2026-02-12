<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $count = \Illuminate\Support\Facades\DB::table('reservation_histories')->count();
    echo "DB count: $count\n";
    $rows = \Illuminate\Support\Facades\DB::table('reservation_histories')->limit(5)->get();
    foreach ($rows as $r) {
        echo json_encode($r) . "\n";
    }
} catch (Throwable $e) {
    echo get_class($e) . ': ' . $e->getMessage() . "\n";
}

