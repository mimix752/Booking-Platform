<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class ReservationRequest extends FormRequest
{
    /**
     * Déterminer si l'utilisateur est autorisé à faire cette requête
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Règles de validation
     */
    public function rules()
    {
        return [
            'local_id' => 'required|exists:locaux,id',
            'date_debut' => 'required|date|after_or_equal:today',
            'date_fin' => 'required|date|after_or_equal:date_debut',
            'creneau' => 'required|in:matin,apres-midi,journee-complete',
            'nature_evenement' => 'required|in:reunion,audience,convention,conference,congres',
            'participants_estimes' => 'required|integer|min:1|max:1000',
            'motif' => 'required|string|min:10|max:500',
            'priorite' => 'nullable|in:normale,urgente,presidence'
        ];
    }

    /**
     * Messages de validation personnalisés
     */
    public function messages()
    {
        return [
            'local_id.required' => 'Le local est obligatoire',
            'local_id.exists' => 'Le local sélectionné n\'existe pas',
            'date_debut.required' => 'La date de début est obligatoire',
            'date_debut.after_or_equal' => 'La date de début doit être aujourd\'hui ou dans le futur',
            'date_fin.required' => 'La date de fin est obligatoire',
            'date_fin.after_or_equal' => 'La date de fin doit être égale ou postérieure à la date de début',
            'creneau.required' => 'Le créneau est obligatoire',
            'creneau.in' => 'Le créneau sélectionné n\'est pas valide',
            'nature_evenement.required' => 'La nature de l\'événement est obligatoire',
            'nature_evenement.in' => 'La nature de l\'événement n\'est pas valide',
            'participants_estimes.required' => 'Le nombre de participants est obligatoire',
            'participants_estimes.integer' => 'Le nombre de participants doit être un nombre entier',
            'participants_estimes.min' => 'Il doit y avoir au moins 1 participant',
            'participants_estimes.max' => 'Le nombre maximum de participants est 1000',
            'motif.required' => 'Le motif de la réservation est obligatoire',
            'motif.min' => 'Le motif doit contenir au moins 10 caractères',
            'motif.max' => 'Le motif ne peut pas dépasser 500 caractères'
        ];
    }

    /**
     * Gérer une tentative de validation échouée
     */
    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Erreurs de validation',
            'errors' => $validator->errors()
        ], 422));
    }
}