<?php

namespace Tests\Feature;

use App\Models\Reservation;
use App\Models\ReservationHistory;
use App\Models\User;
use App\Models\Local;
use App\Models\Site;
use App\Services\ReservationHistoryService;
use Tests\TestCase;

class ReservationHistoryTest extends TestCase
{
    protected $user;
    protected $local;
    protected $site;

    protected function setUp(): void
    {
        parent::setUp();

        // Créer les données de test
        $this->site = Site::factory()->create();
        $this->local = Local::factory()->create(['site_id' => $this->site->id]);
        $this->user = User::factory()->create();
    }

    /**
     * Test: Enregistrer la création d'une réservation
     */
    public function test_record_reservation_creation()
    {
        $reservation = Reservation::factory()->create([
            'user_id' => $this->user->id,
            'local_id' => $this->local->id,
        ]);

        $this->actingAs($this->user);
        ReservationHistoryService::recordCreation($reservation, 'Test creation');

        $this->assertDatabaseHas('reservation_histories', [
            'reservation_id' => $reservation->id,
            'action' => 'created',
            'description' => 'Test creation'
        ]);
    }

    /**
     * Test: Enregistrer la validation d'une réservation
     */
    public function test_record_reservation_validation()
    {
        $reservation = Reservation::factory()->create([
            'user_id' => $this->user->id,
            'local_id' => $this->local->id,
            'statut' => 'en_attente'
        ]);

        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        ReservationHistoryService::recordValidation($reservation, 'Validation approuvée');

        $this->assertDatabaseHas('reservation_histories', [
            'reservation_id' => $reservation->id,
            'action' => 'validated',
            'statut_ancien' => 'en_attente',
            'statut_nouveau' => 'confirmee',
            'raison' => 'Validation approuvée'
        ]);
    }

    /**
     * Test: Enregistrer le refus d'une réservation
     */
    public function test_record_reservation_refusal()
    {
        $reservation = Reservation::factory()->create([
            'user_id' => $this->user->id,
            'local_id' => $this->local->id,
            'statut' => 'en_attente'
        ]);

        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        ReservationHistoryService::recordRefusal($reservation, 'Salle non disponible');

        $this->assertDatabaseHas('reservation_histories', [
            'reservation_id' => $reservation->id,
            'action' => 'refused',
            'raison' => 'Salle non disponible'
        ]);
    }

    /**
     * Test: Enregistrer l'annulation d'une réservation
     */
    public function test_record_reservation_cancellation()
    {
        $reservation = Reservation::factory()->create([
            'user_id' => $this->user->id,
            'local_id' => $this->local->id,
            'statut' => 'confirmee'
        ]);

        $this->actingAs($this->user);

        ReservationHistoryService::recordCancellation($reservation, 'Raison personnelle');

        $this->assertDatabaseHas('reservation_histories', [
            'reservation_id' => $reservation->id,
            'action' => 'cancelled',
            'raison' => 'Raison personnelle'
        ]);
    }

    /**
     * Test: Enregistrer une modification de réservation
     */
    public function test_record_reservation_update()
    {
        $reservation = Reservation::factory()->create([
            'user_id' => $this->user->id,
            'local_id' => $this->local->id,
            'participants_estimes' => 10
        ]);

        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        $changes = ['participants_estimes' => 20];
        ReservationHistoryService::recordUpdate($reservation, $changes, 'Mise à jour du nombre de participants');

        $this->assertDatabaseHas('reservation_histories', [
            'reservation_id' => $reservation->id,
            'action' => 'updated',
        ]);

        $history = ReservationHistory::where('reservation_id', $reservation->id)->first();
        $this->assertEquals(10, $history->old_values['participants_estimes']);
        $this->assertEquals(20, $history->new_values['participants_estimes']);
    }

    /**
     * Test: Récupérer l'historique d'une réservation
     */
    public function test_get_reservation_history()
    {
        $reservation = Reservation::factory()->create([
            'user_id' => $this->user->id,
            'local_id' => $this->local->id,
        ]);

        $this->actingAs($this->user);
        ReservationHistoryService::recordCreation($reservation);

        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);
        ReservationHistoryService::recordValidation($reservation);

        $history = ReservationHistoryService::getReservationHistory($reservation);

        $this->assertEquals(2, $history->total());
    }

    /**
     * Test: Récupérer l'historique avec filtres
     */
    public function test_get_all_history_with_filters()
    {
        $reservation = Reservation::factory()->create([
            'user_id' => $this->user->id,
            'local_id' => $this->local->id,
        ]);

        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);
        ReservationHistoryService::recordValidation($reservation);

        // Filtrer par action
        $history = ReservationHistoryService::getAllHistory(['action' => 'validated']);
        $this->assertTrue($history->total() > 0);

        // Filtrer par ID de réservation
        $history = ReservationHistoryService::getAllHistory(['reservation_id' => $reservation->id]);
        $this->assertEquals(1, $history->total());

        // Filtrer par ID d'utilisateur (admin qui a effectué l'action)
        $history = ReservationHistoryService::getAllHistory(['user_id' => $admin->id]);
        $this->assertTrue($history->total() > 0);
    }

    /**
     * Test: Vérifier que les données IP et user agent sont enregistrées
     */
    public function test_history_records_ip_and_user_agent()
    {
        $reservation = Reservation::factory()->create([
            'user_id' => $this->user->id,
            'local_id' => $this->local->id,
        ]);

        $this->actingAs($this->user);
        ReservationHistoryService::recordCreation($reservation);

        $history = ReservationHistory::where('reservation_id', $reservation->id)->first();

        $this->assertNotNull($history->ip_address);
        $this->assertNotNull($history->user_agent);
    }

    /**
     * Test: API endpoint - récupérer l'historique global
     */
    public function test_api_get_reservation_history()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $reservation = Reservation::factory()->create([
            'user_id' => $this->user->id,
            'local_id' => $this->local->id,
        ]);

        $this->actingAs($admin);
        ReservationHistoryService::recordValidation($reservation);

        $response = $this->getJson('/api/admin/reservations/history');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'reservation_id',
                        'action',
                        'created_at'
                    ]
                ],
                'pagination' => [
                    'total',
                    'page',
                    'limit',
                    'totalPages'
                ]
            ]);
    }

    /**
     * Test: API endpoint - récupérer l'historique d'une réservation spécifique
     */
    public function test_api_get_reservation_detail_history()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $reservation = Reservation::factory()->create([
            'user_id' => $this->user->id,
            'local_id' => $this->local->id,
        ]);

        $this->actingAs($admin);
        ReservationHistoryService::recordCreation($reservation);

        $response = $this->getJson("/api/admin/reservations/{$reservation->id}/history");

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.0.reservation_id', $reservation->id);
    }

    /**
     * Test: API endpoint - filtrer l'historique par action
     */
    public function test_api_filter_history_by_action()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin);

        $response = $this->getJson('/api/admin/reservations/history?action=validated');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    /**
     * Test: API endpoint - filtrer l'historique par date
     */
    public function test_api_filter_history_by_date()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin);

        $response = $this->getJson('/api/admin/reservations/history?date_from=2026-02-01&date_to=2026-02-28');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }
}

