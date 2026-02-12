# Configuration Backend pour l'Historique des Réservations

## ✅ Frontend - Configuration terminée

Le frontend appelle maintenant: **`GET /admin/reservation-histories`**

---

## ❌ Backend - À IMPLÉMENTER

### Endpoint requis: `GET /admin/reservation-histories`

Cet endpoint doit récupérer **toutes les entrées** de la table `reservation_histories`.

---

## 📋 Structure attendue de la table `reservation_histories`

Votre table devrait avoir des colonnes comme:

```sql
reservation_histories
├── id (INT, PRIMARY KEY)
├── reservation_id (INT, FK vers reservations)
├── nom_demandeur (VARCHAR)
├── email_demandeur (VARCHAR)
├── salle (VARCHAR)
├── lieu (VARCHAR)
├── date_debut (DATE)
├── date_fin (DATE)
├── heure_debut (TIME)
├── heure_fin (TIME)
├── raison (TEXT)
├── type_reunion (VARCHAR)
├── nombre_participants (INT)
├── status (ENUM: 'confirmed', 'refused', 'cancelled')
├── commentaire_admin (TEXT)
├── treated_at (TIMESTAMP) -- Date de traitement
├── treated_by (INT) -- Admin qui a traité
└── created_at (TIMESTAMP)
```

---

## 🔧 Implémentation Backend (Laravel)

### 1. Route à ajouter (routes/api.php)

```php
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    // Endpoint pour récupérer l'historique des réservations
    Route::get('/admin/reservation-histories', [ReservationHistoryController::class, 'index']);
});
```

### 2. Créer le Controller

**Commande:**
```bash
php artisan make:controller Api/ReservationHistoryController
```

**Code du Controller:**
```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReservationHistory;
use Illuminate\Http\Request;

class ReservationHistoryController extends Controller
{
    /**
     * Récupérer tout l'historique des réservations
     */
    public function index(Request $request)
    {
        try {
            // Récupérer toutes les entrées de l'historique
            $histories = ReservationHistory::with('reservation', 'admin')
                ->orderBy('treated_at', 'desc') // Plus récentes en premier
                ->get();

            return response()->json([
                'success' => true,
                'data' => $histories
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement de l\'historique',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
```

### 3. Créer le Modèle ReservationHistory (si pas encore fait)

**Commande:**
```bash
php artisan make:model ReservationHistory
```

**Code du Modèle:**
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReservationHistory extends Model
{
    protected $table = 'reservation_histories';

    protected $fillable = [
        'reservation_id',
        'nom_demandeur',
        'email_demandeur',
        'salle',
        'lieu',
        'date_debut',
        'date_fin',
        'heure_debut',
        'heure_fin',
        'raison',
        'type_reunion',
        'nombre_participants',
        'status',
        'commentaire_admin',
        'treated_at',
        'treated_by'
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
        'treated_at' => 'datetime',
    ];

    // Relation avec la réservation originale
    public function reservation()
    {
        return $this->belongsTo(Reservation::class);
    }

    // Relation avec l'admin qui a traité
    public function admin()
    {
        return $this->belongsTo(User::class, 'treated_by');
    }
}
```

---

## 📝 Logique de création d'entrées dans reservation_histories

Quand un admin **valide**, **refuse** ou qu'un utilisateur **annule** une réservation, vous devez créer une entrée dans `reservation_histories`.

### Exemple: Dans ReservationController::validate()

```php
public function validate(Request $request, $id)
{
    $reservation = Reservation::findOrFail($id);
    
    // Mettre à jour le statut
    $reservation->status = 'confirmed';
    $reservation->commentaire_admin = $request->commentaire_admin;
    $reservation->save();

    // ✅ CRÉER UNE ENTRÉE DANS L'HISTORIQUE
    ReservationHistory::create([
        'reservation_id' => $reservation->id,
        'nom_demandeur' => $reservation->nom_demandeur,
        'email_demandeur' => $reservation->email_demandeur,
        'salle' => $reservation->salle,
        'lieu' => $reservation->lieu,
        'date_debut' => $reservation->date_debut,
        'date_fin' => $reservation->date_fin,
        'heure_debut' => $reservation->heure_debut,
        'heure_fin' => $reservation->heure_fin,
        'raison' => $reservation->raison,
        'type_reunion' => $reservation->type_reunion,
        'nombre_participants' => $reservation->nombre_participants,
        'status' => 'confirmed',
        'commentaire_admin' => $request->commentaire_admin,
        'treated_at' => now(),
        'treated_by' => auth()->id()
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Réservation confirmée',
        'data' => $reservation
    ]);
}
```

### Exemple: Dans ReservationController::refuse()

```php
public function refuse(Request $request, $id)
{
    $reservation = Reservation::findOrFail($id);
    
    $reservation->status = 'refused';
    $reservation->commentaire_admin = $request->commentaire_admin;
    $reservation->save();

    // ✅ CRÉER UNE ENTRÉE DANS L'HISTORIQUE
    ReservationHistory::create([
        'reservation_id' => $reservation->id,
        'nom_demandeur' => $reservation->nom_demandeur,
        'email_demandeur' => $reservation->email_demandeur,
        'salle' => $reservation->salle,
        'lieu' => $reservation->lieu,
        'date_debut' => $reservation->date_debut,
        'date_fin' => $reservation->date_fin,
        'heure_debut' => $reservation->heure_debut,
        'heure_fin' => $reservation->heure_fin,
        'raison' => $reservation->raison,
        'type_reunion' => $reservation->type_reunion,
        'nombre_participants' => $reservation->nombre_participants,
        'status' => 'refused',
        'commentaire_admin' => $request->commentaire_admin,
        'treated_at' => now(),
        'treated_by' => auth()->id()
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Réservation refusée',
        'data' => $reservation
    ]);
}
```

### Exemple: Dans ReservationController::cancel()

```php
public function cancel(Request $request, $id)
{
    $reservation = Reservation::findOrFail($id);
    
    $reservation->status = 'cancelled';
    $reservation->cancellation_reason = $request->cancellation_reason;
    $reservation->save();

    // ✅ CRÉER UNE ENTRÉE DANS L'HISTORIQUE
    ReservationHistory::create([
        'reservation_id' => $reservation->id,
        'nom_demandeur' => $reservation->nom_demandeur,
        'email_demandeur' => $reservation->email_demandeur,
        'salle' => $reservation->salle,
        'lieu' => $reservation->lieu,
        'date_debut' => $reservation->date_debut,
        'date_fin' => $reservation->date_fin,
        'heure_debut' => $reservation->heure_debut,
        'heure_fin' => $reservation->heure_fin,
        'raison' => $reservation->raison,
        'type_reunion' => $reservation->type_reunion,
        'nombre_participants' => $reservation->nombre_participants,
        'status' => 'cancelled',
        'commentaire_admin' => $request->cancellation_reason,
        'treated_at' => now(),
        'treated_by' => auth()->id()
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Réservation annulée',
        'data' => $reservation
    ]);
}
```

---

## 🧪 Tester l'endpoint

### Avec Postman ou curl:

```bash
curl -X GET "http://localhost:8000/api/admin/reservation-histories" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

### Réponse attendue:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "reservation_id": 5,
      "nom_demandeur": "Pr. Fatima Zahra",
      "email_demandeur": "f.zahra@uca.ac.ma",
      "salle": "Salle Innovation Hub",
      "lieu": "Cité d'Innovation",
      "date_debut": "2026-01-29",
      "date_fin": "2026-01-29",
      "heure_debut": "14:00:00",
      "heure_fin": "17:00:00",
      "raison": "Réunion de coordination",
      "type_reunion": "Réunion",
      "nombre_participants": 30,
      "status": "confirmed",
      "commentaire_admin": "Validé - Équipements prêts",
      "treated_at": "2026-02-10T10:30:00.000000Z",
      "treated_by": 1,
      "created_at": "2026-02-10T10:30:00.000000Z",
      "updated_at": "2026-02-10T10:30:00.000000Z"
    }
  ]
}
```

---

## ✅ Checklist

- [ ] Créer le modèle `ReservationHistory`
- [ ] Créer le controller `ReservationHistoryController`
- [ ] Ajouter la route `GET /admin/reservation-histories`
- [ ] Modifier `validate()` pour créer une entrée dans l'historique
- [ ] Modifier `refuse()` pour créer une entrée dans l'historique
- [ ] Modifier `cancel()` pour créer une entrée dans l'historique
- [ ] Tester l'endpoint
- [ ] Vérifier que le frontend affiche les données

---

## 🎉 Une fois terminé

Rechargez la page frontend: http://localhost:5173/admin/historique

L'historique devrait maintenant afficher toutes les réservations traitées!

