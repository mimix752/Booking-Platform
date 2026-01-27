import React, { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Wrench, Plus, Edit, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { locaux as initialLocaux } from '../data/locaux';

const MaintenancePage = () => {
  const [locaux, setLocaux] = useState(initialLocaux.map(local => ({
    ...local,
    enMaintenance: false,
    dateMaintenance: null,
    motifMaintenance: '',
  })));

  const [showModal, setShowModal] = useState(false);
  const [selectedLocal, setSelectedLocal] = useState(null);
  const [maintenanceForm, setMaintenanceForm] = useState({
    dateDebut: '',
    dateFin: '',
    motif: '',
    description: '',
  });

  const handleOpenModal = (local) => {
    setSelectedLocal(local);
    setShowModal(true);
    setMaintenanceForm({
      dateDebut: '',
      dateFin: '',
      motif: '',
      description: '',
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedLocal(null);
  };

  const handleMettreEnMaintenance = () => {
    if (!maintenanceForm.dateDebut || !maintenanceForm.dateFin || !maintenanceForm.motif) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLocaux(locaux.map(local => 
      local.id === selectedLocal.id 
        ? { 
            ...local, 
            enMaintenance: true, 
            disponible: false,
            dateMaintenance: {
              debut: maintenanceForm.dateDebut,
              fin: maintenanceForm.dateFin,
            },
            motifMaintenance: maintenanceForm.motif,
            descriptionMaintenance: maintenanceForm.description,
          }
        : local
    ));
    handleCloseModal();
  };

  const handleRetirerMaintenance = (localId) => {
    setLocaux(locaux.map(local => 
      local.id === localId 
        ? { 
            ...local, 
            enMaintenance: false, 
            disponible: true,
            dateMaintenance: null,
            motifMaintenance: '',
            descriptionMaintenance: '',
          }
        : local
    ));
  };

  const locauxEnMaintenance = locaux.filter(l => l.enMaintenance);
  const locauxDisponibles = locaux.filter(l => !l.enMaintenance && l.disponible);
  const locauxIndisponibles = locaux.filter(l => !l.enMaintenance && !l.disponible);

  return (
    <AdminLayout>
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-amber-800 mb-2"> Gestion de la Maintenance</h2>
          <p className="text-gray-600">Gérez l'état de maintenance des locaux</p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-yellow-800">{locauxEnMaintenance.length}</p>
                <p className="text-sm text-yellow-700">En maintenance</p>
              </div>
              <Wrench className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-800">{locauxDisponibles.length}</p>
                <p className="text-sm text-green-700">Disponibles</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-800">{locauxIndisponibles.length}</p>
                <p className="text-sm text-red-700">Indisponibles</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Locaux en maintenance */}
        {locauxEnMaintenance.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4"> Locaux en maintenance</h3>
            <div className="space-y-4">
              {locauxEnMaintenance.map(local => (
                <div key={local.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-lg">{local.nom}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Site: {local.site} | Capacité: {local.capacite} personnes
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-yellow-800">
                          <span className="font-medium">Période:</span> {local.dateMaintenance?.debut} au {local.dateMaintenance?.fin}
                        </p>
                        <p className="text-sm text-yellow-800">
                          <span className="font-medium">Motif:</span> {local.motifMaintenance}
                        </p>
                        {local.descriptionMaintenance && (
                          <p className="text-sm text-yellow-700">
                            <span className="font-medium">Description:</span> {local.descriptionMaintenance}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRetirerMaintenance(local.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Retirer de la maintenance
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tous les locaux */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4"> Tous les locaux</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {locaux.map(local => (
              <div
                key={local.id}
                className={`border rounded-lg p-4 ${
                  local.enMaintenance 
                    ? 'border-yellow-200 bg-yellow-50' 
                    : local.disponible 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{local.nom}</h4>
                      {local.enMaintenance && (
                        <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs font-medium">
                          En maintenance
                        </span>
                      )}
                      {!local.enMaintenance && local.disponible && (
                        <span className="px-2 py-1 bg-green-200 text-green-800 rounded text-xs font-medium">
                          Disponible
                        </span>
                      )}
                      {!local.enMaintenance && !local.disponible && (
                        <span className="px-2 py-1 bg-red-200 text-red-800 rounded text-xs font-medium">
                          Indisponible
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {local.site} | {local.capacite} personnes
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {local.equipements.slice(0, 3).map((eq, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {eq}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    {!local.enMaintenance && (
                      <button
                        onClick={() => handleOpenModal(local)}
                        className="p-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                        title="Mettre en maintenance"
                      >
                        <Wrench className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de maintenance */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Mettre en maintenance: {selectedLocal?.nom}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début *
                </label>
                <input
                  type="date"
                  value={maintenanceForm.dateDebut}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, dateDebut: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin *
                </label>
                <input
                  type="date"
                  value={maintenanceForm.dateFin}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, dateFin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motif *
                </label>
                <select
                  value={maintenanceForm.motif}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, motif: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="">Sélectionner un motif</option>
                  <option value="Réparation">Réparation</option>
                  <option value="Nettoyage">Nettoyage approfondi</option>
                  <option value="Rénovation">Rénovation</option>
                  <option value="Inspection">Inspection technique</option>
                  <option value="Équipement">Installation d'équipement</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optionnel)
                </label>
                <textarea
                  value={maintenanceForm.description}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  rows="3"
                  placeholder="Détails supplémentaires..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleMettreEnMaintenance}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Confirmer
              </button>
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default MaintenancePage;