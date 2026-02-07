<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blackout_dates', function (Blueprint $table) {
            $table->id();
            $table->date('date')->unique();
            $table->string('raison', 255);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blackout_dates');
    }
};

