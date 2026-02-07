<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class SiteRequest extends FormRequest
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
        $siteId = $this->route('id');

        $rules = [
            'nom' => 'required|string|min:3|max:255',
            'adresse' => 'nullable|string|max:500',
            'description' => 'nullable|string|max:2000',
            'is_active' => 'boolean'
        ];

        // Pour la création, le site_id est obligatoire et unique
        if ($this->isMethod('post')) {
            $rules['site_id'] = [
                'required',
                'string',
                'unique:sites,site_id',
                'regex:/^[a-z0-9-]+$/',
                'min:3',
                'max:50'
            ];
        }

        return $rules;
    }

    /**
     * Messages de validation personnalisés
     */
    public function messages()
    {
        return [
            'site_id.required' => 'L\'identifiant du site est obligatoire',
            'site_id.unique' => 'Cet identifiant de site existe déjà',
            'site_id.regex' => 'L\'identifiant ne peut contenir que des lettres minuscules, chiffres et tirets',
            'site_id.min' => 'L\'identifiant doit contenir au moins 3 caractères',
            'site_id.max' => 'L\'identifiant ne peut pas dépasser 50 caractères',
            'nom.required' => 'Le nom du site est obligatoire',
            'nom.min' => 'Le nom doit contenir au moins 3 caractères',
            'nom.max' => 'Le nom ne peut pas dépasser 255 caractères',
            'adresse.max' => 'L\'adresse ne peut pas dépasser 500 caractères',
            'description.max' => 'La description ne peut pas dépasser 2000 caractères'
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