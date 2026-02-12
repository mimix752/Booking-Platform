<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$email = 'dev.admin@local';
$password = 'Admin123456!';
$outPath = __DIR__ . '/admin_token.txt';

try {
    $user = User::where('email', $email)->first();
    if (!$user) {
        $user = User::create([
            'email' => $email,
            'name' => 'Dev Admin',
            'password' => Hash::make($password),
            'role' => 'admin',
            'is_active' => true
        ]);
    } else {
        $user->update(['role' => 'admin', 'is_active' => true]);
    }

    // delete existing tokens
    foreach ($user->tokens as $t) { $t->delete(); }

    $token = $user->createToken('dev_token')->plainTextToken;
    $content = "TOKEN:" . $token . "\nEMAIL:" . $email . "\nPASSWORD:" . $password . "\n";
    file_put_contents($outPath, $content);
} catch (Throwable $e) {
    file_put_contents($outPath, get_class($e) . ': ' . $e->getMessage());
}
