<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('local_id')->constrained('locaux')->cascadeOnDelete();

            $table->date('date_debut');
            $table->date('date_fin');
            $table->string('creneau');
            $table->string('nature_evenement');
            $table->unsignedInteger('participants_estimes');
            $table->text('motif');

            $table->string('statut')->default('en_attente');
            $table->string('priorite')->nullable();
            $table->text('commentaire_admin')->nullable();

            $table->foreignId('validated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('validated_at')->nullable();

            $table->foreignId('cancelled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('cancelled_at')->nullable();
            $table->text('cancellation_reason')->nullable();

            $table->timestamps();

            $table->index(['local_id', 'date_debut', 'date_fin']);
            $table->index(['user_id', 'statut']);
            $table->index('statut');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};

