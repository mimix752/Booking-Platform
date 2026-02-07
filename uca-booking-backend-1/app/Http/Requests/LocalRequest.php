<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class LocalRequest extends FormRequest
{
    /**
     * Déterminer si l'utilisateur est autorisé à faire cette requête
     */
    public function authorize()
    {
        return $this->user() && $this->user()->isAdmin();
    }

    /**
     * Règles de validation
     */
    public function rules()
    {
        $rules = [
            'nom' => 'required|string|min:3|max:255',
            'capacite' => 'required|integer|min:1|max:1000',
            'equipements' => 'required|array',
            'equipements.*' => 'string',
            'statut' => 'in:disponible,occupé,maintenance',
            'contraintes' => 'nullable|string|max:1000',
            'description' => 'nullable|string|max:2000',
            'image_url' => 'nullable|url',
            'is_active' => 'boolean'
        ];

        // Pour la création, le site_id est obligatoire
        if ($this->isMethod('post')) {
            $rules['site_id'] = 'required|exists:sites,id';
        }

        return $rules;
    }

    /**
     * Messages de validation personnalisés
     */
    public function messages()
    {
        return [
            'site_id.required' => 'Le site est obligatoire',
            'site_id.exists' => 'Le site sélectionné n\'existe pas',
            'nom.required' => 'Le nom du local est obligatoire',
            'nom.min' => 'Le nom doit contenir au moins 3 caractères',
            'nom.max' => 'Le nom ne peut pas dépasser 255 caractères',
            'capacite.required' => 'La capacité est obligatoire',
            'capacite.integer' => 'La capacité doit être un nombre entier',
            'capacite.min' => 'La capacité minimale est 1 personne',
            'capacite.max' => 'La capacité maximale est 1000 personnes',
            'equipements.required' => 'Les équipements sont obligatoires',
            'equipements.array' => 'Les équipements doivent être une liste',
            'statut.in' => 'Le statut sélectionné n\'est pas valide',
            'image_url.url' => 'L\'URL de l\'image n\'est pas valide'
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

    /**
     * Gérer une autorisation échouée
     */
    protected function failedAuthorization()
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => 'Non autorisé. Droits administrateur requis.'
        ], 403));
    }
}