<?php

namespace Database\Seeders;

use App\Models\Local;
use App\Models\Reservation;
use App\Models\Site;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     * Synchronisé avec la base de données de production.
     * Utilise updateOrCreate pour être idempotent.
     */
    public function run(): void
    {
        // ===================== USERS =====================
        $users = [
            [
                'email' => 'admin@uca.ac.ma',
                'name' => 'Admin',
                'password' => Hash::make('1111111111@'),
                'role' => 'admin',
                'is_active' => true,
                'fonction' => 'Personnel administratif',
                'telephone' => '0623876566',
            ],
            [
                'email' => 'email.admin@uca.ac.ma',
                'name' => 'Admin',
                'password' => Hash::make('1111111111@'),
                'role' => 'admin',
                'is_active' => true,
                'fonction' => 'Personnel administratif',
            ],
            [
                'email' => 't.ghadi@uca.ac.ma',
                'name' => 't.ghadi',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'is_active' => true,
            ],
            [
                'email' => 'h.ghadi@uca.ac.ma',
                'name' => 'h.ghadi',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'is_active' => true,
            ],
            [
                'email' => 't.ghadi1076@uca.ac.ma',
                'name' => 'Taha GHADI',
                'google_id' => '100918392205059170704',
                'picture' => 'https://lh3.googleusercontent.com/a/ACg8ocJGhq7S56HYlpJZcg7EyrP1NF69vfyq_D9XaMFLjVwe9fhxeg=s96-c',
                'password' => null,
                'role' => 'user',
                'is_active' => true,
                'telephone' => '0639621297',
            ],
            [
                'email' => 'dev.admin@local',
                'name' => 'Dev Admin',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'is_active' => true,
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }

        // ===================== SITES =====================
        $campusCentral = Site::updateOrCreate(
            ['site_id' => 'CC'],
            [
                'nom' => 'Campus Central',
                'adresse' => 'Marrakech',
                'description' => 'Site principal - salles et amphithéâtres',
                'is_active' => true,
            ]
        );

        $fst = Site::updateOrCreate(
            ['site_id' => 'FST'],
            [
                'nom' => 'Faculté des Sciences',
                'adresse' => 'Marrakech',
                'description' => 'Salles de cours et laboratoires',
                'is_active' => true,
            ]
        );

        // ===================== LOCAUX =====================
        $locauxCC = [
            [
                'nom' => 'Amphi A1',
                'capacite' => 250,
                'equipements' => ['Projecteur', 'Micro', 'WiFi'],
                'statut' => 'disponible',
                'contraintes' => 'Accès autorisé',
                'description' => 'Grand amphithéâtre pour conférences',
                'is_active' => true,
            ],
            [
                'nom' => 'Salle 101',
                'capacite' => 40,
                'equipements' => ['Tableau', 'Projecteur'],
                'statut' => 'disponible',
                'contraintes' => null,
                'description' => 'Salle standard',
                'is_active' => false,
            ],
            [
                'nom' => 'Salle Test API',
                'capacite' => 25,
                'equipements' => ['projecteur'],
                'statut' => 'disponible',
                'contraintes' => null,
                'description' => 'Test via API public',
                'is_active' => false,
            ],
            [
                'nom' => 'test',
                'capacite' => 30,
                'equipements' => ['Projecteur', 'Micro', 'WiFi'],
                'statut' => 'disponible',
                'contraintes' => 'Accès autorisé',
                'description' => null,
                'is_active' => false,
            ],
        ];

        foreach ($locauxCC as $localData) {
            Local::updateOrCreate(
                ['site_id' => $campusCentral->id, 'nom' => $localData['nom']],
                array_merge($localData, ['site_id' => $campusCentral->id])
            );
        }

        $locauxFST = [
            [
                'nom' => 'Salle Info 1',
                'capacite' => 30,
                'equipements' => ['PC', 'Projecteur', 'WiFi'],
                'statut' => 'disponible',
                'contraintes' => 'Réservation prioritaire enseignants',
                'description' => 'Laboratoire informatique',
                'is_active' => true,
            ],
            [
                'nom' => 'Salle TD 3',
                'capacite' => 35,
                'equipements' => ['Tableau'],
                'statut' => 'disponible',
                'contraintes' => null,
                'description' => 'Salle TD',
                'is_active' => true,
            ],
        ];

        foreach ($locauxFST as $localData) {
            Local::updateOrCreate(
                ['site_id' => $fst->id, 'nom' => $localData['nom']],
                array_merge($localData, ['site_id' => $fst->id])
            );
        }

        // ===================== RESERVATIONS =====================
        // On récupère les IDs des users/locaux par leur identifiant unique
        $adminId = User::where('email', 'admin@uca.ac.ma')->first()->id;
        $tGhadiId = User::where('email', 't.ghadi@uca.ac.ma')->first()->id;
        $hGhadiId = User::where('email', 'h.ghadi@uca.ac.ma')->first()->id;
        $tahaId = User::where('email', 't.ghadi1076@uca.ac.ma')->first()->id;

        $amphiA1 = Local::where('nom', 'Amphi A1')->first()->id;
        $salle101 = Local::where('nom', 'Salle 101')->first()->id;
        $salleInfo1 = Local::where('nom', 'Salle Info 1')->first()->id;

        $reservations = [
            [
                'user_id' => $tGhadiId,
                'local_id' => $amphiA1,
                'date_debut' => '2026-02-07',
                'date_fin' => '2026-02-10',
                'creneau' => 'matin',
                'nature_evenement' => 'audience',
                'participants_estimes' => 10,
                'motif' => 'fszeihlkbfsfklibnselbsbksfrdfserd',
                'statut' => 'confirmee',
                'validated_by' => $adminId,
                'validated_at' => '2026-02-07 22:59:47',
            ],
            [
                'user_id' => $tGhadiId,
                'local_id' => $amphiA1,
                'date_debut' => '2026-02-07',
                'date_fin' => '2026-02-19',
                'creneau' => 'apres-midi',
                'nature_evenement' => 'convention',
                'participants_estimes' => 10,
                'motif' => 'aaaaaaaaaaaaaxcuuuuuuuuuuuuuuuur',
                'statut' => 'confirmee',
                'validated_by' => $adminId,
                'validated_at' => '2026-02-07 20:23:49',
            ],
            [
                'user_id' => $hGhadiId,
                'local_id' => $salleInfo1,
                'date_debut' => '2026-02-08',
                'date_fin' => '2026-02-16',
                'creneau' => 'matin',
                'nature_evenement' => 'audience',
                'participants_estimes' => 20,
                'motif' => 'pppppppppppdkddddddddddddddsssssssssss',
                'statut' => 'confirmee',
                'validated_by' => $adminId,
                'validated_at' => '2026-02-07 23:31:55',
            ],
            [
                'user_id' => $hGhadiId,
                'local_id' => $salleInfo1,
                'date_debut' => '2026-04-09',
                'date_fin' => '2026-05-02',
                'creneau' => 'journee-complete',
                'nature_evenement' => 'congres',
                'participants_estimes' => 10,
                'motif' => 'fcddsfsfsdsqf',
                'statut' => 'confirmee',
                'validated_by' => $adminId,
                'validated_at' => '2026-02-07 23:34:20',
            ],
            [
                'user_id' => $hGhadiId,
                'local_id' => $amphiA1,
                'date_debut' => '2026-05-08',
                'date_fin' => '2026-05-21',
                'creneau' => 'journee-complete',
                'nature_evenement' => 'convention',
                'participants_estimes' => 10,
                'motif' => 'dzzedffdfef',
                'statut' => 'confirmee',
                'validated_by' => $adminId,
                'validated_at' => '2026-02-07 23:42:48',
            ],
            [
                'user_id' => $tahaId,
                'local_id' => $amphiA1,
                'date_debut' => '2026-06-12',
                'date_fin' => '2026-06-26',
                'creneau' => 'matin',
                'nature_evenement' => 'audience',
                'participants_estimes' => 10,
                'motif' => 'esdfsfdefedse',
                'statut' => 'confirmee',
                'validated_by' => $adminId,
                'validated_at' => '2026-02-10 17:48:53',
            ],
            [
                'user_id' => $tahaId,
                'local_id' => $salleInfo1,
                'date_debut' => '2027-01-10',
                'date_fin' => '2027-01-13',
                'creneau' => 'matin',
                'nature_evenement' => 'convention',
                'participants_estimes' => 10,
                'motif' => '2ZZZAAAAAAA',
                'statut' => 'confirmee',
                'validated_by' => $adminId,
                'validated_at' => '2026-02-10 19:32:17',
            ],
            [
                'user_id' => $tahaId,
                'local_id' => $amphiA1,
                'date_debut' => '2026-02-12',
                'date_fin' => '2026-02-13',
                'creneau' => 'matin',
                'nature_evenement' => 'reunion',
                'participants_estimes' => 10,
                'motif' => 'qasasasasas',
                'statut' => 'confirmee',
            ],
            [
                'user_id' => $tahaId,
                'local_id' => $salleInfo1,
                'date_debut' => '2026-03-13',
                'date_fin' => '2026-03-27',
                'creneau' => 'apres-midi',
                'nature_evenement' => 'audience',
                'participants_estimes' => 10,
                'motif' => 'ssqsqdqsxqs',
                'statut' => 'confirmee',
                'validated_by' => $adminId,
                'validated_at' => '2026-02-12 02:06:54',
            ],
            [
                'user_id' => $tahaId,
                'local_id' => $amphiA1,
                'date_debut' => '2028-06-12',
                'date_fin' => '2028-06-22',
                'creneau' => 'matin',
                'nature_evenement' => 'audience',
                'participants_estimes' => 10,
                'motif' => 'azzzzzzzzzzzzz',
                'statut' => 'confirmee',
                'validated_by' => $adminId,
                'validated_at' => '2026-02-13 22:28:15',
            ],
            [
                'user_id' => $tahaId,
                'local_id' => $salle101,
                'date_debut' => '2026-02-13',
                'date_fin' => '2026-02-20',
                'creneau' => 'matin',
                'nature_evenement' => 'convention',
                'participants_estimes' => 10,
                'motif' => 'zzézézzzzz',
                'statut' => 'confirmee',
                'validated_by' => $adminId,
                'validated_at' => '2026-02-13 22:28:11',
            ],
            [
                'user_id' => $tahaId,
                'local_id' => $salle101,
                'date_debut' => '2026-02-28',
                'date_fin' => '2026-03-05',
                'creneau' => 'apres-midi',
                'nature_evenement' => 'audience',
                'participants_estimes' => 10,
                'motif' => 'AZAE',
                'statut' => 'confirmee',
                'validated_by' => $adminId,
                'validated_at' => '2026-02-13 22:53:00',
            ],
        ];

        foreach ($reservations as $resData) {
            Reservation::updateOrCreate(
                [
                    'user_id' => $resData['user_id'],
                    'local_id' => $resData['local_id'],
                    'date_debut' => $resData['date_debut'],
                    'creneau' => $resData['creneau'],
                ],
                $resData
            );
        }
    }
}
