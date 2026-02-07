<?php

namespace App\Mail;

use App\Models\Reservation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ReservationRefused extends Mailable
{
    use Queueable, SerializesModels;

    public $reservation;

    /**
     * Create a new message instance.
     */
    public function __construct(Reservation $reservation)
    {
        $this->reservation = $reservation;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject('❌ Réservation refusée - UCA Booking')
            ->view('emails.reservation-refused')
            ->with([
                'userName' => $this->reservation->user->name,
                'localNom' => $this->reservation->local->nom,
                'siteNom' => $this->reservation->local->site->nom,
                'dateDebut' => $this->reservation->date_debut->format('d/m/Y'),
                'dateFin' => $this->reservation->date_fin->format('d/m/Y'),
                'creneau' => $this->reservation->creneau_label,
                'natureEvenement' => ucfirst($this->reservation->nature_evenement),
                'commentaireAdmin' => $this->reservation->commentaire_admin,
                'reservationId' => $this->reservation->id
            ]);
    }
}