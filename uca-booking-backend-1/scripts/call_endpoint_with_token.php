<?php
$tokenFile = __DIR__ . '/admin_token.txt';
$token = null;
if (file_exists($tokenFile)) {
    $lines = file($tokenFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, 'TOKEN:') === 0) {
            $token = substr($line, strlen('TOKEN:'));
            break;
        }
    }
}
if (!$token) {
    file_put_contents(__DIR__ . '/endpoint_response.json', json_encode(['error' => 'no token']));
    exit;
}

$ch = curl_init('http://127.0.0.1:8000/api/admin/reservation-histories');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'Authorization: Bearer ' . $token
]);
$res = curl_exec($ch);
$info = curl_getinfo($ch);
curl_close($ch);
file_put_contents(__DIR__ . '/endpoint_response.json', json_encode(['info' => $info, 'body' => $res]));

