<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $needsValidation ? 'Demande de réservation' : 'Confirmation de réservation' }}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
    <h2 style="margin: 0 0 12px;">
        {{ $needsValidation ? 'Votre demande de réservation a été soumise' : 'Votre réservation est confirmée' }}
    </h2>

    <p>Bonjour {{ $userName }},</p>

    @if($needsValidation)
        <p>
            Nous avons bien reçu votre demande de réservation. Elle est actuellement <strong>en attente de validation</strong> par un administrateur.
        </p>
    @else
        <p>
            Votre réservation a été <strong>confirmée</strong>. Ci-dessous les détails.
        </p>
    @endif

    <h3>Détails</h3>
    <ul>
        <li><strong>Local</strong> : {{ $localNom }}</li>
        <li><strong>Site</strong> : {{ $siteNom }}</li>
        <li><strong>Date début</strong> : {{ $dateDebut }}</li>
        <li><strong>Date fin</strong> : {{ $dateFin }}</li>
        <li><strong>Créneau</strong> : {{ $creneau }}</li>
        <li><strong>Événement</strong> : {{ $natureEvenement }}</li>
        <li><strong>Participants estimés</strong> : {{ $participants }}</li>
        <li><strong>Statut</strong> : {{ $statut }}</li>
        <li><strong>Réservation #</strong> : {{ $reservationId }}</li>
    </ul>

    <p style="margin-top: 16px;">
        Cordialement,<br>
        UCA Booking
    </p>
</body>
</html>

