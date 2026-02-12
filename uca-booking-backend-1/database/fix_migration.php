#!/usr/bin/env php
<?php
/**
 * Manual Database Fix Script
 * This script fixes the password nullable issue for SQLite without artisan
 */

try {
    // Open SQLite database
    $dbPath = __DIR__ . '/database/database.sqlite';

    if (!file_exists($dbPath)) {
        die("❌ Database file not found at: $dbPath\n");
    }

    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "✅ Connected to SQLite database\n";

    // Check current schema
    $columns = $pdo->query("PRAGMA table_info(users)")->fetchAll(PDO::FETCH_ASSOC);

    echo "\n📋 Current users table schema:\n";
    foreach ($columns as $column) {
        $nullable = $column['notnull'] ? '❌ NOT NULL' : '✅ NULLABLE';
        echo "  - {$column['name']}: {$nullable}\n";
    }

    // Find password column
    $passwordColumn = array_filter($columns, fn($col) => $col['name'] === 'password');
    if (empty($passwordColumn)) {
        die("❌ Password column not found!\n");
    }

    $passwordInfo = array_values($passwordColumn)[0];

    if (!$passwordInfo['notnull']) {
        echo "\n✅ Password column is already NULLABLE\n";
        echo "   No changes needed!\n";
        exit(0);
    }

    echo "\n⚠️  Password column is NOT NULLABLE\n";
    echo "   This needs to be fixed for Google OAuth users\n\n";

    // Backup original table
    echo "📦 Creating backup...\n";
    $pdo->exec("CREATE TABLE users_backup AS SELECT * FROM users");
    echo "✅ Backup created: users_backup\n\n";

    // Create new table with correct schema
    echo "🔧 Migrating table schema...\n";

    $pdo->exec("
        CREATE TABLE users_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            email_verified_at DATETIME,
            password TEXT,
            remember_token TEXT,
            created_at DATETIME,
            updated_at DATETIME,
            google_id TEXT,
            picture TEXT,
            fonction TEXT,
            role TEXT NOT NULL DEFAULT 'user',
            is_active INTEGER NOT NULL DEFAULT 1,
            last_login DATETIME
        )
    ");
    echo "✅ New table created\n";

    // Copy data
    echo "📋 Copying data...\n";
    $pdo->exec("
        INSERT INTO users_new
        SELECT id, name, email, email_verified_at, password, remember_token,
               created_at, updated_at, google_id, picture, fonction, role,
               is_active, last_login
        FROM users
    ");
    echo "✅ Data copied\n";

    // Drop old table and rename
    echo "🗑️  Replacing old table...\n";
    $pdo->exec("DROP TABLE users");
    $pdo->exec("ALTER TABLE users_new RENAME TO users");
    echo "✅ Table replaced\n\n";

    // Verify
    echo "✅ Verification:\n";
    $columns = $pdo->query("PRAGMA table_info(users)")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $column) {
        if ($column['name'] === 'password') {
            $nullable = $column['notnull'] ? '❌ NOT NULL' : '✅ NULLABLE';
            echo "  - Password field is now: $nullable\n";
        }
    }

    // Check data integrity
    $count = $pdo->query("SELECT COUNT(*) as count FROM users")->fetch(PDO::FETCH_ASSOC);
    echo "\n📊 Data integrity: {$count['count']} users preserved\n";

    echo "\n✨ Migration successful!\n";
    echo "You can now safely delete the backup table: users_backup\n";
    echo "Just run: php database/fix_migration.php --cleanup\n";

    // Optional cleanup
    if (isset($argv[1]) && $argv[1] === '--cleanup') {
        $pdo->exec("DROP TABLE IF EXISTS users_backup");
        echo "\n🗑️  Backup table cleaned up\n";
    }

} catch (PDOException $e) {
    die("❌ Database error: " . $e->getMessage() . "\n");
} catch (Exception $e) {
    die("❌ Error: " . $e->getMessage() . "\n");
}
?>

