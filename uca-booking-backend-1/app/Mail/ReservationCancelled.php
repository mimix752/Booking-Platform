<?php

namespace App\Mail;

use App\Models\Reservation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ReservationCancelled extends Mailable
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
        $cancelledBy = $this->reservation->statut === 'annulee_admin' ? 'administration' : 'vous';
        
        return $this->subject('🚫 Réservation annulée - UCA Booking')
            ->view('emails.reservation-cancelled')
            ->with([
                'userName' => $this->reservation->user->name,
                'localNom' => $this->reservation->local->nom,
                'siteNom' => $this->reservation->local->site->nom,
                'dateDebut' => $this->reservation->date_debut->format('d/m/Y'),
                'dateFin' => $this->reservation->date_fin->format('d/m/Y'),
                'creneau' => $this->reservation->creneau_label,
                'natureEvenement' => ucfirst($this->reservation->nature_evenement),
                'cancelledBy' => $cancelledBy,
                'cancellationReason' => $this->reservation->cancellation_reason,
                'cancelledAt' => $this->reservation->cancelled_at->format('d/m/Y H:i'),
                'reservationId' => $this->reservation->id
            ]);
    }
}