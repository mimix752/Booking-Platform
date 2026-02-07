import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Wrench, AlertCircle, CheckCircle } from 'lucide-react';
import { getAdminLocaux, setLocalMaintenance } from '../services/adminLocauxService';

const MaintenancePage = () => {
  const [locaux, setLocaux] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadLocaux = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAdminLocaux();
      const data = res?.data || [];
      const mapped = data.map((l) => ({
        id: l.id,
        nom: l.nom,
        capacite: l.capacite,
        site: l.site?.nom || '',
        equipements: Array.isArray(l.equipements) ? l.equipements : [],
        statut: l.statut,
        disponible: l.statut === 'disponible',
        enMaintenance: l.statut === 'maintenance',
      }));
      setLocaux(mapped);
    } catch (e) {
      setError(e?.message || 'Erreur lors du chargement des locaux');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocaux();
  }, []);

  const handleMettreEnMaintenance = async (local) => {
    try {
      await setLocalMaintenance(local.id, true);
      await loadLocaux();
    } catch (e) {
      alert(e?.message || 'Erreur lors de la mise en maintenance');
    }
  };

  const handleRetirerMaintenance = async (localId) => {
    try {
      await setLocalMaintenance(localId, false);
      await loadLocaux();
    } catch (e) {
      alert(e?.message || 'Erreur lors du retrait de maintenance');
    }
  };

  const locauxEnMaintenance = useMemo(() => locaux.filter(l => l.enMaintenance), [locaux]);
  const locauxDisponibles = useMemo(() => locaux.filter(l => !l.enMaintenance && l.disponible), [locaux]);
  const locauxIndisponibles = useMemo(() => locaux.filter(l => !l.enMaintenance && !l.disponible), [locaux]);

  return (
    <AdminLayout>
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-amber-800 mb-2"> Gestion de la Maintenance</h2>
          <p className="text-gray-600">Gérez l'état de maintenance des locaux</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {loading && (
          <div className="mb-6 text-sm text-gray-500">Chargement…</div>
        )}

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
                        onClick={() => handleMettreEnMaintenance(local)}
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
    </AdminLayout>
  );
};

export default MaintenancePage;

