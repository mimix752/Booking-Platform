<?php

namespace App\Services;

use App\Models\Reservation;
use App\Mail\ReservationCreated;
use App\Mail\ReservationConfirmed;
use App\Mail\ReservationRefused;
use App\Mail\ReservationCancelled;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class EmailService
{
    /**
     * Envoyer un email de confirmation de soumission
     */
    public function sendReservationCreatedEmail(Reservation $reservation)
    {
        try {
            Mail::to($reservation->user->email)->send(new ReservationCreated($reservation));
            
            Log::info('Email de création envoyé', [
                'reservation_id' => $reservation->id,
                'user_email' => $reservation->user->email
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Erreur envoi email création: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Envoyer un email de validation
     */
    public function sendReservationConfirmedEmail(Reservation $reservation)
    {
        try {
            Mail::to($reservation->user->email)->send(new ReservationConfirmed($reservation));
            
            Log::info('Email de confirmation envoyé', [
                'reservation_id' => $reservation->id,
                'user_email' => $reservation->user->email
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Erreur envoi email confirmation: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Envoyer un email de refus
     */
    public function sendReservationRefusedEmail(Reservation $reservation)
    {
        try {
            Mail::to($reservation->user->email)->send(new ReservationRefused($reservation));
            
            Log::info('Email de refus envoyé', [
                'reservation_id' => $reservation->id,
                'user_email' => $reservation->user->email
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Erreur envoi email refus: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Envoyer un email d'annulation
     */
    public function sendReservationCancelledEmail(Reservation $reservation)
    {
        try {
            Mail::to($reservation->user->email)->send(new ReservationCancelled($reservation));
            
            Log::info('Email d\'annulation envoyé', [
                'reservation_id' => $reservation->id,
                'user_email' => $reservation->user->email
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Erreur envoi email annulation: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Envoyer un rappel avant événement
     */
    public function sendReminderEmail(Reservation $reservation, $hoursBeforeEvent = 24)
    {
        try {
            // Logique pour rappel personnalisé
            $subject = "Rappel : Réservation dans {$hoursBeforeEvent}h";
            
            Mail::to($reservation->user->email)->send(
                new \App\Mail\ReservationReminder($reservation, $hoursBeforeEvent)
            );
            
            Log::info('Email de rappel envoyé', [
                'reservation_id' => $reservation->id,
                'hours_before' => $hoursBeforeEvent
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Erreur envoi email rappel: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Envoyer un email groupé aux administrateurs
     */
    public function sendAdminNotification($subject, $message, $data = [])
    {
        try {
            $admins = \App\Models\User::admin()->active()->get();

            foreach ($admins as $admin) {
                Mail::to($admin->email)->send(
                    new \App\Mail\AdminNotification($subject, $message, $data)
                );
            }

            Log::info('Notification admin envoyée', [
                'subject' => $subject,
                'recipients' => $admins->count()
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Erreur envoi notification admin: ' . $e->getMessage());
            return false;
        }
    }
}