<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Models\Local;
use App\Models\User;
use App\Models\Site;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    /**
     * KPIs du Dashboard
     */
    public function getDashboardKPIs()
    {
        try {
            $data = [
                'totalReservations' => Reservation::count(),
                'confirmedReservations' => Reservation::where('statut', 'confirmee')->count(),
                'pendingReservations' => Reservation::where('statut', 'en_attente')->count(),
                'cancelledReservations' => Reservation::whereIn('statut', ['annulee_utilisateur', 'annulee_admin'])->count(),
                'totalLocaux' => Local::active()->count(),
                'totalUsers' => User::active()->count(),
                'occupancyRate' => $this->calculateOccupancyRate()
            ];

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des KPIs'
            ], 500);
        }
    }

    /**
     * Top 5 des locaux les plus réservés
     */
    public function getTopLocaux(Request $request)
    {
        try {
            $limit = $request->get('limit', 5);

            $topLocaux = Local::select('locaux.*')
                ->selectRaw('COUNT(reservations.id) as total_reservations')
                ->selectRaw('SUM(CASE WHEN reservations.statut = "confirmee" THEN 1 ELSE 0 END) as confirmed_count')
                ->leftJoin('reservations', 'locaux.id', '=', 'reservations.local_id')
                ->with('site')
                ->where('locaux.is_active', true)
                ->groupBy('locaux.id')
                ->orderBy('total_reservations', 'desc')
                ->limit($limit)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $topLocaux
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des locaux populaires'
            ], 500);
        }
    }

    /**
     * Répartition des réservations par statut
     */
    public function getReservationsByStatus()
    {
        try {
            $stats = Reservation::select('statut')
                ->selectRaw('COUNT(*) as count')
                ->groupBy('statut')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques'
            ], 500);
        }
    }

    /**
     * Activité mensuelle des réservations
     */
    public function getMonthlyActivity(Request $request)
    {
        try {
            $months = $request->get('months', 6);

            $activity = Reservation::select(
                    DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
                    DB::raw('COUNT(*) as total'),
                    DB::raw('SUM(CASE WHEN statut = "confirmee" THEN 1 ELSE 0 END) as confirmed'),
                    DB::raw('SUM(CASE WHEN statut = "en_attente" THEN 1 ELSE 0 END) as pending')
                )
                ->where('created_at', '>=', now()->subMonths($months))
                ->groupBy('month')
                ->orderBy('month', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $activity
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de l\'activité mensuelle'
            ], 500);
        }
    }

    /**
     * Statistiques par site
     */
    public function getStatsBySite()
    {
        try {
            $stats = Site::select('sites.*')
                ->selectRaw('COUNT(DISTINCT locaux.id) as total_locaux')
                ->selectRaw('COUNT(reservations.id) as total_reservations')
                ->selectRaw('SUM(CASE WHEN reservations.statut = "confirmee" THEN 1 ELSE 0 END) as confirmed_reservations')
                ->selectRaw('ROUND(AVG(reservations.participants_estimes), 0) as avg_participants')
                ->leftJoin('locaux', 'sites.id', '=', 'locaux.site_id')
                ->leftJoin('reservations', 'locaux.id', '=', 'reservations.local_id')
                ->where('sites.is_active', true)
                ->groupBy('sites.id')
                ->orderBy('total_reservations', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques par site'
            ], 500);
        }
    }

    /**
     * Taux d'occupation par local
     */
    public function getOccupancyRates()
    {
        try {
            $occupancy = DB::table('v_stats_locaux')
                ->orderBy('taux_confirmation', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $occupancy
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des taux d\'occupation'
            ], 500);
        }
    }

    /**
     * Statistiques utilisateurs
     */
    public function getUserStats()
    {
        try {
            $userStats = DB::table('v_user_history')
                ->orderBy('total_reservations', 'desc')
                ->limit(20)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $userStats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques utilisateurs'
            ], 500);
        }
    }

    /**
     * Export des réservations (CSV)
     */
    public function exportReservations(Request $request)
    {
        try {
            $query = Reservation::with(['user', 'local.site']);

            // Filtres
            if ($request->has('startDate')) {
                $query->where('date_debut', '>=', $request->startDate);
            }

            if ($request->has('endDate')) {
                $query->where('date_fin', '<=', $request->endDate);
            }

            if ($request->has('status')) {
                $query->where('statut', $request->status);
            }

            if ($request->has('siteId')) {
                $query->whereHas('local', function($q) use ($request) {
                    $q->where('site_id', $request->siteId);
                });
            }

            $reservations = $query->orderBy('created_at', 'desc')->get();

            if ($reservations->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucune donnée à exporter'
                ], 404);
            }

            // Générer le CSV
            $csv = "ID,Utilisateur,Email,Local,Site,Date Début,Date Fin,Créneau,Nature,Participants,Statut,Créé le\n";

            foreach ($reservations as $reservation) {
                $csv .= implode(',', [
                    $reservation->id,
                    '"' . $reservation->user->name . '"',
                    $reservation->user->email,
                    '"' . $reservation->local->nom . '"',
                    '"' . $reservation->local->site->nom . '"',
                    $reservation->date_debut->format('Y-m-d'),
                    $reservation->date_fin->format('Y-m-d'),
                    $reservation->creneau,
                    $reservation->nature_evenement,
                    $reservation->participants_estimes,
                    $reservation->statut,
                    $reservation->created_at->format('Y-m-d H:i:s')
                ]) . "\n";
            }

            return response($csv, 200)
                ->header('Content-Type', 'text/csv')
                ->header('Content-Disposition', 'attachment; filename="reservations.csv"');

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'export des données'
            ], 500);
        }
    }

    /**
     * Calculer le taux d'occupation global
     */
    private function calculateOccupancyRate()
    {
        $total = Reservation::where('date_debut', '>=', now()->subDays(30))->count();
        $confirmed = Reservation::where('statut', 'confirmee')
            ->where('date_debut', '>=', now()->subDays(30))
            ->count();

        return $total > 0 ? round(($confirmed / $total) * 100, 2) : 0;
    }
}