import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Users, MapPin, Clock, ArrowLeft, Check } from 'lucide-react';
import { createReservation } from '../services/reservationService';
import { api } from '../utils/apiClient';

const ReservationPage = () => {
  const { localId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [local, setLocal] = useState(null);
  const [loadingLocal, setLoadingLocal] = useState(true);
  const [formData, setFormData] = useState({
    fonction: '',
    natureEvenement: '',
    participants: 10,
    dateDebut: '',
    dateFin: '',
    creneau: 'matin',
    motif: '',
    isMultiJour: false
  });

  const [step, setStep] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [reservationStatus, setReservationStatus] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const loadLocal = async () => {
      setLoadingLocal(true);
      try {
        const { data } = await api.get(`/locaux/${localId}`);
        if (!data?.success) throw new Error(data?.message || 'Erreur chargement local');
        setLocal(data.data);
      } catch (e) {
        console.error(e);
        navigate('/');
      } finally {
        setLoadingLocal(false);
      }
    };

    loadLocal();
  }, [localId, isAuthenticated, navigate]);

  const siteName = useMemo(() => {
    // Backend renvoie local.site.nom (relation) si loaded
    return local?.site?.nom || local?.site?.name || local?.site?.site_id || '';
  }, [local]);

  const fonctions = [
    'Professeur',
    'Personnel administratif',
    'Chef de service',
    'Chef de division',
    'Directeur de pôle',
    'Autre'
  ];

  const naturesEvenement = [
    { value: 'reunion', label: 'Réunion', icon: '👥' },
    { value: 'audience', label: 'Audience officielle', icon: '🏛️' },
    { value: 'convention', label: 'Signature de convention', icon: '📝' },
    { value: 'conference', label: 'Conférence', icon: '🎤' },
    { value: 'congres', label: 'Congrès', icon: '🎯' }
  ];

  const creneaux = [
    { value: 'matin', label: 'Matin (8h-12h)' },
    { value: 'apres-midi', label: 'Après-midi (14h-18h)' },
    { value: 'journee', label: 'Journée complète' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitReservation = async () => {
    try {
      const motif = (formData.motif || '').trim();
      if (motif.length < 10) {
        alert('Le motif doit contenir au moins 10 caractères.');
        return;
      }

      // Mapping Front -> API Laravel
      const payload = {
        local_id: parseInt(localId, 10),
        date_debut: formData.dateDebut,
        date_fin: formData.dateFin,
        creneau:
          formData.creneau === 'journee'
            ? 'journee-complete'
            : formData.creneau, // matin | apres-midi | journee-complete
        nature_evenement: formData.natureEvenement,
        participants_estimes: Number(formData.participants),
        motif,
      };

      const result = await createReservation(payload);

      // Backend renvoie: { id, statut, needsValidation }
      setReservationStatus(result?.statut);
      setShowModal(true);
    } catch (e) {
      console.error(e);
      alert(e?.message || 'Erreur lors de la réservation');
    }
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  if (loadingLocal || !local) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-amber-800 hover:text-amber-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Retour à l'accueil
            </button>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Connecté en tant que</p>
                <p className="font-medium text-gray-900">{user?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= stepNumber ? 'bg-amber-800 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {step > stepNumber ? <Check className="w-5 h-5" /> : stepNumber}
              </div>
              {stepNumber < 3 && (
                <div className={`w-24 h-1 mx-4 ${
                  step > stepNumber ? 'bg-amber-800' : 'bg-gray-200'
                }`}></div>
              )}
            </div>
          ))}
        </div>

        {/* Local Info Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{local.nom}</h2>
              <div className="flex items-center space-x-4 text-gray-600">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{siteName}</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  <span>{local.capacite} personnes</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {(local.equipements || []).map((eq, idx) => (
                  <span key={idx} className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                    {eq}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Form Steps */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Étape 1: Informations générales */}
          {step === 1 && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6">Informations générales</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Votre fonction *
                  </label>
                  <select
                    value={formData.fonction}
                    onChange={(e) => handleInputChange('fonction', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-800"
                    required
                  >
                    <option value="">Sélectionnez votre fonction</option>
                    {fonctions.map(fonction => (
                      <option key={fonction} value={fonction}>{fonction}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nature de l'événement *
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {naturesEvenement.map(nature => (
                      <label key={nature.value} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="natureEvenement"
                          value={nature.value}
                          checked={formData.natureEvenement === nature.value}
                          onChange={(e) => handleInputChange('natureEvenement', e.target.value)}
                          className="mr-3"
                        />
                        <span className="mr-2">{nature.icon}</span>
                        <span>{nature.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de participants estimés
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="5"
                    max="200"
                    step="5"
                    value={formData.participants}
                    onChange={(e) => handleInputChange('participants', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-lg font-bold min-w-[80px] text-center">
                    {formData.participants} pers.
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5 min</span>
                  <span>200 max</span>
                </div>

                {formData.participants > local.capacite && (
                  <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-orange-800 text-sm">
                      ⚠️ Attention : Ce local peut accueillir maximum {local.capacite} personnes
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Étape 2: Choix de la période */}
          {step === 2 && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6">Choix de la période</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de début *
                  </label>
                  <input
                    type="date"
                    value={formData.dateDebut}
                    onChange={(e) => handleInputChange('dateDebut', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de fin *
                  </label>
                  <input
                    type="date"
                    value={formData.dateFin}
                    onChange={(e) => {
                      handleInputChange('dateFin', e.target.value);
                      const isMulti = e.target.value !== formData.dateDebut;
                      handleInputChange('isMultiJour', isMulti);
                    }}
                    min={formData.dateDebut || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-800"
                    required
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Créneau horaire
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {creneaux.map(creneau => (
                    <label key={creneau.value} className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="creneau"
                        value={creneau.value}
                        checked={formData.creneau === creneau.value}
                        onChange={(e) => handleInputChange('creneau', e.target.value)}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium">{creneau.label}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {formData.isMultiJour && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-blue-600 mr-2" />
                    <p className="text-blue-800 text-sm font-medium">
                      Réservation sur plusieurs jours détectée - Validation administrative requise
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Étape 3: Récapitulatif */}
          {step === 3 && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6">Récapitulatif et confirmation</h3>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h4 className="font-bold text-gray-900 mb-4">Détails de votre réservation</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Local :</span>
                    <span className="ml-2">{local.nom}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Site :</span>
                    <span className="ml-2">{siteName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Fonction :</span>
                    <span className="ml-2">{formData.fonction}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Événement :</span>
                    <span className="ml-2">{naturesEvenement.find(n => n.value === formData.natureEvenement)?.label}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Participants :</span>
                    <span className="ml-2">{formData.participants} personnes</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Créneau :</span>
                    <span className="ml-2">{creneaux.find(c => c.value === formData.creneau)?.label}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-700">Période :</span>
                    <span className="ml-2">{formData.dateDebut} {formData.dateFin !== formData.dateDebut ? `au ${formData.dateFin}` : ''}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motif de la réservation *
                </label>
                <textarea
                  value={formData.motif}
                  onChange={(e) => handleInputChange('motif', e.target.value)}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-800"
                  placeholder="Décrivez brièvement l'objet de votre réservation..."
                  required
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>

            {step < 3 ? (
              <button
                onClick={nextStep}
                disabled={
                  (step === 1 && (!formData.fonction || !formData.natureEvenement)) ||
                  (step === 2 && (!formData.dateDebut || !formData.dateFin))
                }
                className="px-6 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            ) : (
              <button
                onClick={handleSubmitReservation}
                disabled={formData.motif.trim().length < 10}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmer la réservation
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmation */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              {reservationStatus === 'confirmee' ? (
                <>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-green-800 mb-2">Réservation confirmée !</h3>
                  <p className="text-gray-600 mb-4">
                    Votre réservation a été confirmée automatiquement. Un email de confirmation a été envoyé à votre adresse académique.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-bold text-yellow-800 mb-2">En attente de validation</h3>
                  <p className="text-gray-600 mb-4">
                    Votre demande de réservation nécessite une validation administrative. Vous recevrez un email dès que votre demande sera traitée.
                  </p>
                </>
              )}

              <button
                onClick={() => navigate('/')}
                className="w-full px-4 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900 transition-colors"
              >
                Retourner à l'accueil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationPage;
