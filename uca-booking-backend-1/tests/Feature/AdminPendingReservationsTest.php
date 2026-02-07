<?php

namespace Tests\Feature;

use App\Models\Local;
use App\Models\Reservation;
use App\Models\Site;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminPendingReservationsTest extends TestCase
{
    use RefreshDatabase;

    private function createSetup(): array
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        $user = User::factory()->create([
            'role' => 'user',
            'is_active' => true,
        ]);

        $site = Site::create([
            'site_id' => 'site-test',
            'nom' => 'Site Test',
            'adresse' => 'Adresse',
            'description' => 'Desc',
            'is_active' => true,
        ]);

        $local = Local::create([
            'site_id' => $site->id,
            'nom' => 'Local Test',
            'capacite' => 20,
            'equipements' => ['projecteur'],
            'is_active' => true,
        ]);

        return compact('admin', 'user', 'site', 'local');
    }

    public function test_admin_can_list_pending_reservations_only(): void
    {
        $setup = $this->createSetup();

        Reservation::create([
            'user_id' => $setup['user']->id,
            'local_id' => $setup['local']->id,
            'date_debut' => now()->addDays(10)->toDateString(),
            'date_fin' => now()->addDays(10)->toDateString(),
            'creneau' => 'matin',
            'nature_evenement' => 'reunion',
            'participants_estimes' => 10,
            'motif' => 'Motif assez long',
            'priorite' => 'normale',
            'statut' => 'en_attente',
        ]);

        Reservation::create([
            'user_id' => $setup['user']->id,
            'local_id' => $setup['local']->id,
            'date_debut' => now()->addDays(11)->toDateString(),
            'date_fin' => now()->addDays(11)->toDateString(),
            'creneau' => 'matin',
            'nature_evenement' => 'reunion',
            'participants_estimes' => 10,
            'motif' => 'Motif assez long',
            'priorite' => 'normale',
            'statut' => 'confirmee',
        ]);

        $this->actingAs($setup['admin'], 'sanctum');

        $response = $this->getJson('/api/admin/reservations/pending');

        $response->assertOk();
        $response->assertJson(['success' => true]);
        $this->assertCount(1, $response->json('data'));
        $this->assertSame('en_attente', $response->json('data.0.statut'));
    }

    public function test_guest_cannot_access_pending_reservations(): void
    {
        $response = $this->getJson('/api/admin/reservations/pending');
        $response->assertStatus(401);
    }

    public function test_non_admin_cannot_access_pending_reservations(): void
    {
        $setup = $this->createSetup();
        $this->actingAs($setup['user'], 'sanctum');

        $response = $this->getJson('/api/admin/reservations/pending');
        $response->assertStatus(403);
    }

    public function test_pending_reservations_paginates(): void
    {
        $setup = $this->createSetup();

        for ($i = 0; $i < 3; $i++) {
            Reservation::create([
                'user_id' => $setup['user']->id,
                'local_id' => $setup['local']->id,
                'date_debut' => now()->addDays(10 + $i)->toDateString(),
                'date_fin' => now()->addDays(10 + $i)->toDateString(),
                'creneau' => 'matin',
                'nature_evenement' => 'reunion',
                'participants_estimes' => 10,
                'motif' => 'Motif assez long',
                'priorite' => 'normale',
                'statut' => 'en_attente',
            ]);
        }

        $this->actingAs($setup['admin'], 'sanctum');

        $response = $this->getJson('/api/admin/reservations/pending?limit=1');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertSame(3, $response->json('pagination.total'));
        $this->assertSame(1, $response->json('pagination.limit'));
    }
}
