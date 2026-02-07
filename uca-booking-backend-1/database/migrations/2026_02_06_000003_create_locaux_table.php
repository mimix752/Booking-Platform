<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('locaux', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained('sites')->cascadeOnDelete();
            $table->string('nom');
            $table->unsignedInteger('capacite');
            $table->json('equipements')->nullable();
            $table->string('statut')->default('disponible');
            $table->text('contraintes')->nullable();
            $table->text('description')->nullable();
            $table->text('image_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['site_id', 'is_active']);
            $table->index('statut');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('locaux');
    }
};

