<?php

namespace App\Mail;

use App\Models\Reservation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ReservationCreated extends Mailable
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
        $subject = $this->reservation->statut === 'en_attente' 
            ? 'Demande de réservation soumise - En attente de validation'
            : 'Confirmation de votre réservation';

        return $this->subject($subject)
            ->view('emails.reservation-created')
            ->with([
                'userName' => $this->reservation->user->name,
                'localNom' => $this->reservation->local->nom,
                'siteNom' => $this->reservation->local->site->nom,
                'dateDebut' => $this->reservation->date_debut->format('d/m/Y'),
                'dateFin' => $this->reservation->date_fin->format('d/m/Y'),
                'creneau' => $this->reservation->creneau_label,
                'natureEvenement' => ucfirst($this->reservation->nature_evenement),
                'participants' => $this->reservation->participants_estimes,
                'statut' => $this->reservation->statut,
                'needsValidation' => $this->reservation->statut === 'en_attente',
                'reservationId' => $this->reservation->id
            ]);
    }
}