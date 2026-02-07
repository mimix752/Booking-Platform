<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Note: Avoid altering existing columns to keep this migration working
            // without requiring doctrine/dbal.

            if (!Schema::hasColumn('users', 'google_id')) {
                $table->string('google_id')->nullable()->unique()->after('id');
            }

            if (!Schema::hasColumn('users', 'picture')) {
                $table->text('picture')->nullable()->after('name');
            }

            if (!Schema::hasColumn('users', 'fonction')) {
                $table->string('fonction')->nullable()->after('picture');
            }

            if (!Schema::hasColumn('users', 'role')) {
                $table->string('role')->default('user')->after('fonction');
            }

            if (!Schema::hasColumn('users', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('role');
            }

            if (!Schema::hasColumn('users', 'last_login')) {
                $table->timestamp('last_login')->nullable()->after('is_active');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop index with known default name if it exists
            try {
                $table->dropUnique('users_google_id_unique');
            } catch (\Throwable $e) {
                // ignore
            }

            $columns = ['google_id', 'picture', 'fonction', 'role', 'is_active', 'last_login'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};

