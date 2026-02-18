<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $local = \App\Models\Local::with('site')->orderBy('id', 'desc')->first();
    if ($local) {
        echo json_encode($local->toArray(), JSON_PRETTY_PRINT) . "\n";
    } else {
        echo "No locals found\n";
    }
} catch (Throwable $e) {
    echo get_class($e) . ': ' . $e->getMessage() . "\n";
}

