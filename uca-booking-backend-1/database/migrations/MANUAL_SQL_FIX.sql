-- Alternative: If artisan migrate doesn't work, run this SQL directly

-- For MySQL
ALTER TABLE users MODIFY password VARCHAR(255) NULL;

-- For SQLite (if you're using SQLite)
-- SQLite doesn't support direct ALTER COLUMN, so you need to do this workaround:
-- 1. Create new table with correct schema
-- 2. Copy data
-- 3. Drop old table
-- 4. Rename new table

-- This is automatically handled by Laravel's migration, but if needed manually:

BEGIN TRANSACTION;

CREATE TABLE users_new (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NULL,  -- Changed from NOT NULL to NULL
    remember_token VARCHAR(100) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    google_id VARCHAR(255) NULL,
    picture VARCHAR(255) NULL,
    fonction VARCHAR(255) NULL,
    role VARCHAR(255) NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login TIMESTAMP NULL
);

INSERT INTO users_new SELECT * FROM users;

DROP TABLE users;

RENAME TABLE users_new TO users;

COMMIT;

