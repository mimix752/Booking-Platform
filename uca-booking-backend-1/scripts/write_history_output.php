<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$out = ['ok' => true, 'time' => date('c')];
try {
    $history = \App\Services\ReservationHistoryService::getAllHistory([], 10);
    $out['class'] = get_class($history);
    $out['total'] = $history->total();
    $out['count'] = count($history->items());
    $items = [];
    foreach ($history->items() as $h) {
        $items[] = [
            'id' => $h->id ?? null,
            'reservation_id' => $h->reservation_id ?? null,
            'action' => $h->action ?? null,
            'user_id' => $h->user_id ?? null,
            'statut_ancien' => $h->statut_ancien ?? null,
            'statut_nouveau' => $h->statut_nouveau ?? null,
            'created_at' => $h->created_at ?? null,
        ];
    }
    $out['items'] = $items;
} catch (Throwable $e) {
    $out['error_class'] = get_class($e);
    $out['error_message'] = $e->getMessage();
    $out['error_trace'] = $e->getTraceAsString();
}
file_put_contents(__DIR__ . '/history_output.json', json_encode($out, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE));
echo 'WROTE';

