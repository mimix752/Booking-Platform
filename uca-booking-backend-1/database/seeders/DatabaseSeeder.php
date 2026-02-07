<?php

namespace Database\Seeders;

use App\Models\Local;
use App\Models\Site;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed admin account (required)
        User::updateOrCreate(
            ['email' => 'email.admin@uca.ac.ma'],
            [
                'name' => 'Admin',
                'password' => Hash::make('1111111111@'),
                'role' => 'admin',
                'is_active' => true,
                'last_login' => now(),
                'fonction' => 'Personnel administratif',
            ]
        );

        // Seed demo data for sites & locaux so the frontend can use real DB data.
        // Idempotent: we use updateOrCreate.

        $sites = [
            [
                'site_id' => 'CC',
                'nom' => 'Campus Central',
                'adresse' => 'Marrakech',
                'description' => 'Site principal - salles et amphithéâtres',
                'is_active' => true,
            ],
            [
                'site_id' => 'FST',
                'nom' => 'Faculté des Sciences',
                'adresse' => 'Marrakech',
                'description' => 'Salles de cours et laboratoires',
                'is_active' => true,
            ],
        ];

        foreach ($sites as $siteData) {
            $site = Site::updateOrCreate(
                ['site_id' => $siteData['site_id']],
                $siteData
            );

            // Locaux de démo par site
            $locals = match ($site->nom) {
                'Campus Central' => [
                    [
                        'nom' => 'Amphi A',
                        'capacite' => 250,
                        'equipements' => ['Projecteur', 'Micro', 'WiFi'],
                        'statut' => 'disponible',
                        'contraintes' => 'Accès autorisé',
                        'description' => 'Grand amphithéâtre pour conférences',
                        'image_url' => null,
                        'is_active' => true,
                    ],
                    [
                        'nom' => 'Salle 101',
                        'capacite' => 40,
                        'equipements' => ['Tableau', 'Projecteur'],
                        'statut' => 'disponible',
                        'contraintes' => null,
                        'description' => 'Salle standard',
                        'image_url' => null,
                        'is_active' => true,
                    ],
                ],
                default => [
                    [
                        'nom' => 'Salle Info 1',
                        'capacite' => 30,
                        'equipements' => ['PC', 'Projecteur', 'WiFi'],
                        'statut' => 'disponible',
                        'contraintes' => 'Réservation prioritaire enseignants',
                        'description' => 'Laboratoire informatique',
                        'image_url' => null,
                        'is_active' => true,
                    ],
                    [
                        'nom' => 'Salle TD 3',
                        'capacite' => 35,
                        'equipements' => ['Tableau'],
                        'statut' => 'disponible',
                        'contraintes' => null,
                        'description' => 'Salle TD',
                        'image_url' => null,
                        'is_active' => true,
                    ],
                ],
            };

            foreach ($locals as $localData) {
                Local::updateOrCreate(
                    ['site_id' => $site->id, 'nom' => $localData['nom']],
                    array_merge($localData, ['site_id' => $site->id])
                );
            }
        }
    }
}
