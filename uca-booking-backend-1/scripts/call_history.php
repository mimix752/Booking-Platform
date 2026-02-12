<?php
// Boot Laravel framework so we can call services and reproduce the exception
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    echo "START_CALL_HISTORY\n";
    $history = \App\Services\ReservationHistoryService::getAllHistory([], 5);
    if ($history) {
        echo "Type: " . get_class($history) . "\n";
        echo "Total: " . $history->total() . "\n";
        echo "Count items: " . count($history->items()) . "\n";
        foreach ($history->items() as $item) {
            echo json_encode($item) . "\n";
        }
    } else {
        echo "No history returned\n";
    }
    echo "END_CALL_HISTORY\n";
} catch (Throwable $e) {
    echo "Exception: " . get_class($e) . "\n";
    echo "Message: " . $e->getMessage() . "\n";
    echo "Trace:\n" . $e->getTraceAsString() . "\n";
}
