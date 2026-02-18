import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { Plus, Wrench, FileText, TrendingUp, Users, Calendar, Clock, CheckCircle, XCircle, AlertCircle, X, ToggleLeft, ToggleRight, Building2, MapPin } from 'lucide-react';
import { getDashboardKPIs } from '../services/adminStatsService';
import { getAdminReservations, validateAdminReservation, refuseAdminReservation } from '../services/adminReservationService';
import { addLocalPublic, getAllLocauxAdmin, toggleLocalActive, updateLocalStatut } from '../services/adminLocauxService';
import { getSites } from '../services/publicDataService';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    confirmees: 0,
    en_attente: 0,
    refusees: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddLocalModal, setShowAddLocalModal] = useState(false);
  const [newLocal, setNewLocal] = useState({
    nom: '',
    type: 'salle',
    capacite: '',
    equipements: '',
    description: '',
    site_id: ''
  });
  const [sites, setSites] = useState([]);
  const [allLocaux, setAllLocaux] = useState([]);
  const [locauxLoading, setLocauxLoading] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    loadData();
    loadAllLocaux();
    // Fetch sites for the dropdown
    getSites().then(setSites).catch(() => setSites([]));
  }, []);

  const loadAllLocaux = async () => {
    setLocauxLoading(true);
    try {
      const res = await getAllLocauxAdmin();
      setAllLocaux(res?.data || []);
    } catch (e) {
      console.error('Erreur chargement locaux:', e);
    } finally {
      setLocauxLoading(false);
    }
  };

  const handleStatutChange = async (localId, newStatut) => {
    try {
      await updateLocalStatut(localId, newStatut);
      await loadAllLocaux();
    } catch (e) {
      alert(e?.message || 'Erreur lors du changement de statut');
    }
  };

  const handleToggleActive = async (localId) => {
    setTogglingId(localId);
    try {
      await toggleLocalActive(localId);
      await loadAllLocaux();
    } catch (e) {
      alert(e?.message || 'Erreur lors du changement de statut');
    } finally {
      setTogglingId(null);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [kpisRes, pendingRes] = await Promise.all([
        getDashboardKPIs(),
        // On prend les dernières demandes en attente (côté backend: statut=en_attente)
        getAdminReservations({ pending_only: 'true', limit: 50 })
      ]);

      const kpis = kpisRes?.data || {};
      setStats({
        total: kpis.totalReservations ?? 0,
        confirmees: kpis.confirmedReservations ?? 0,
        en_attente: kpis.pendingReservations ?? 0,
        refusees: 0,
        cancelled: kpis.cancelledReservations ?? 0,
        totalLocaux: kpis.totalLocaux ?? 0,
        totalUsers: kpis.totalUsers ?? 0,
        occupancyRate: kpis.occupancyRate ?? 0,
      });

      const pending = pendingRes?.data || [];
      const normalized = pending.map((r) => ({
        id: r.id,
        status: r.statut,
        userName: r.user?.name || '',
        userEmail: r.user?.email || '',
        local: r.local?.nom || '',
        site: r.local?.site?.nom || '',
        dateDebut: r.date_debut,
        dateFin: r.date_fin,
        creneau: r.creneau,
        participants: r.participants_estimes,
        motif: r.motif || '',
        dateCreation: r.created_at,
      }));
      setReservations(normalized);
    } catch (e) {
      setError(e?.message || 'Erreur lors du chargement du dashboard');
    } finally {
      setLoading(false);
    }
  };

  const pendingReservations = reservations
    .filter(r => r.status === 'en_attente')
    .sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation))
    .slice(0, 5);

  const handleStatusChange = async (reservationId, newStatus) => {
    try {
      if (newStatus === 'confirmee') {
        await validateAdminReservation(reservationId);
      } else if (newStatus === 'refusee') {
        // Le backend exige un commentaire_admin min:10
        const commentaire = window.prompt('Motif du refus (min 10 caractères) :', '') || '';
        await refuseAdminReservation(reservationId, commentaire);
      }
      await loadData();
    } catch (e) {
      alert(e?.message || 'Erreur lors de la mise à jour du statut');
    }
  };

  const exportToCSV = () => {
    if (reservations.length === 0) {
      alert('Aucune réservation à exporter');
      return;
    }

    // En-têtes du CSV
    const headers = ['ID', 'Nom', 'Email', 'Date début', 'Date fin', 'Créneau', 'Participants', 'Motif', 'Statut', 'Date création'];
    
    // Données
    const csvData = reservations.map(res => [
      res.id,
      res.userName,
      res.userEmail || '',
      res.dateDebut,
      res.dateFin || res.dateDebut,
      res.creneau,
      res.participants,
      `"${res.motif.replace(/"/g, '""')}"`, // Échapper les guillemets
      res.status,
      new Date(res.dateCreation).toLocaleString('fr-FR')
    ]);

    // Créer le contenu CSV
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    // Créer et télécharger le fichier
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `reservations_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddLocal = async () => {
    setError('');
    try {
      if (!newLocal.site_id) {
        setError('Veuillez sélectionner un site.');
        return;
      }
      // Préparer les données à envoyer
      const payload = {
        nom: newLocal.nom.trim(),
        type: newLocal.type,
        capacite: Number(newLocal.capacite),
        equipements: newLocal.equipements
          ? newLocal.equipements.split(',').map(e => e.trim()).filter(Boolean)
          : [],
        description: newLocal.description?.trim() || '',
        site_id: newLocal.site_id
      };
      await addLocalPublic(payload);
      setShowAddLocalModal(false);
      setNewLocal({ nom: '', type: 'salle', capacite: '', equipements: '', description: '', site_id: '' });
      loadData();
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'ajout du local');
    }
  };

  return (
    <AdminLayout>
      {/* Statistiques Section */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
        <h2 className="text-3xl font-bold text-amber-800 mb-8">Tableau de bord</h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Global Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="p-6 bg-amber-50 rounded-lg">
            <h3 className="text-3xl font-bold text-amber-800">{stats.total}</h3>
            <p className="text-sm text-amber-700">Total réservations</p>
          </div>
          <div className="p-6 bg-green-50 rounded-lg">
            <h3 className="text-3xl font-bold text-green-800">{stats.confirmees}</h3>
            <p className="text-sm text-green-700">Confirmées</p>
          </div>
          <div className="p-6 bg-yellow-50 rounded-lg">
            <h3 className="text-3xl font-bold text-yellow-800">{stats.en_attente}</h3>
            <p className="text-sm text-yellow-700">En attente</p>
          </div>
          <div className="p-6 bg-red-50 rounded-lg">
            <h3 className="text-3xl font-bold text-red-800">{stats.refusees}</h3>
            <p className="text-sm text-red-700">Refusées</p>
          </div>
        </div>

        {/* Taux d'occupation et indicateurs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold text-amber-800 mb-4">Indicateurs clés</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded bg-blue-500"></div>
                  <span className="font-medium">Taux d'occupation</span>
                </div>
                <span className="text-lg font-bold text-amber-800">
                  {typeof stats.occupancyRate === 'number' ? Math.round(stats.occupancyRate) : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded bg-green-500"></div>
                  <span className="font-medium">Taux de validation</span>
                </div>
                <span className="text-lg font-bold text-amber-800">
                  {(stats.total - stats.en_attente) > 0 ? Math.round((stats.confirmees / (stats.total - stats.en_attente)) * 100) : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded bg-purple-500"></div>
                  <span className="font-medium">Demandes en cours</span>
                </div>
                <span className="text-lg font-bold text-amber-800">{stats.en_attente}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-amber-800 mb-4">🤖 Informations système</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Activité récente</h4>
                <p className="text-sm text-blue-700">
                  {reservations.filter(r => {
                    const created = new Date(r.dateCreation);
                    const today = new Date();
                    return created.toDateString() === today.toDateString();
                  }).length} nouvelles demandes aujourd'hui
                </p>
              </div>
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">Locaux populaires</h4>
                <p className="text-sm text-green-700">Les salles de conférence sont les plus demandées</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-800 mb-2">Action requise</h4>
                <p className="text-sm text-orange-700">{stats.en_attente} demandes en attente de validation</p>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="mt-6 text-sm text-gray-500">Chargement…</div>
        )}
      </div>

      {/* Demandes en attente */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-amber-800">Demandes en attente</h2>
            <p className="text-gray-600 mt-1">Gérez les demandes de réservation récentes</p>
          </div>
          <button 
            onClick={() => navigate('/admin/reservations')}
            className="px-4 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900 transition-colors"
          >
            Voir tout ({stats.en_attente})
          </button>
        </div>
        
        {pendingReservations.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <p className="mb-2">Aucune demande en attente</p>
            <p className="text-sm">Toutes les réservations ont été traitées</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingReservations.map((reservation) => (
              <div key={reservation.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{reservation.userName}</h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        En attente
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{reservation.dateDebut}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{reservation.creneau}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        <span>{reservation.participants} participants</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mt-2 truncate">{reservation.motif}</p>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleStatusChange(reservation.id, 'confirmee')}
                      className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                      title="Confirmer"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleStatusChange(reservation.id, 'refusee')}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Refuser"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gestion des locaux - Activation/Désactivation */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-amber-800 flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              Gestion des locaux
            </h2>
            <p className="text-gray-600 mt-1">Activez ou désactivez les locaux visibles aux utilisateurs</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
              {allLocaux.filter(l => l.is_active).length} actifs
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-gray-300 inline-block"></span>
              {allLocaux.filter(l => !l.is_active).length} inactifs
            </span>
          </div>
        </div>

        {locauxLoading ? (
          <div className="text-center py-8 text-gray-500">Chargement des locaux...</div>
        ) : allLocaux.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p>Aucun local en base de données</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Local</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Site</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Capacité</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Statut</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Visible</th>
                </tr>
              </thead>
              <tbody>
                {allLocaux.map((local) => (
                  <tr key={local.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${!local.is_active ? 'opacity-60' : ''}`}>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">{local.nom}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="w-3 h-3" />
                        {local.site?.nom || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600 capitalize">{local.type || '—'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">{local.capacite} pers.</span>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={local.statut || 'disponible'}
                        onChange={(e) => handleStatutChange(local.id, e.target.value)}
                        className={`text-xs font-medium rounded-full px-3 py-1 border-0 cursor-pointer focus:ring-2 focus:ring-amber-500 ${
                          local.statut === 'disponible' ? 'bg-green-100 text-green-800' :
                          local.statut === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                          local.statut === 'en_attente' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <option value="disponible">Disponible</option>
                        <option value="en_attente">En attente</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(local.id)}
                        disabled={togglingId === local.id}
                        className="inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                        title={local.is_active ? 'Désactiver ce local' : 'Activer ce local'}
                      >
                        {local.is_active ? (
                          <ToggleRight className="w-8 h-8 text-green-600 hover:text-green-700" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-gray-400 hover:text-gray-500" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ajouter un local */}
        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Plus className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ajouter un local</h3>
          <p className="text-gray-600 text-sm mb-4">Enregistrez un nouveau local dans la base de données</p>
          <button 
            onClick={() => setShowAddLocalModal(true)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ajouter
          </button>
        </div>

        {/* Mode maintenance */}
        <div 
          onClick={() => navigate('/admin/maintenance')}
          className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
            <Wrench className="w-6 h-6 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Mode maintenance</h3>
          <p className="text-gray-600 text-sm mb-4">Mettez un local en maintenance temporaire</p>
          <button className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
            Gérer
          </button>
        </div>

        {/* Générer un rapport */}
        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Générer un rapport</h3>
          <p className="text-gray-600 text-sm mb-4">Exportez les statistiques au format CSV</p>
          <button 
            onClick={exportToCSV}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Modal Ajouter un local */}
      {showAddLocalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-amber-800">Ajouter un nouveau local</h2>
                <button 
                  onClick={() => setShowAddLocalModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du local <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newLocal.nom}
                    onChange={(e) => setNewLocal({...newLocal, nom: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Ex: Salle de conférence A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de local <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newLocal.type}
                    onChange={(e) => setNewLocal({...newLocal, type: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="salle">Salle de réunion</option>
                    <option value="bureau">Bureau</option>
                    <option value="amphitheatre">Amphithéâtre</option>
                    <option value="laboratoire">Laboratoire</option>
                    <option value="atelier">Atelier</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacité (nombre de personnes) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={newLocal.capacite}
                    onChange={(e) => setNewLocal({...newLocal, capacite: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Ex: 30"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Équipements (séparés par des virgules)
                  </label>
                  <input
                    type="text"
                    value={newLocal.equipements}
                    onChange={(e) => setNewLocal({...newLocal, equipements: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Ex: Projecteur, Tableau blanc, WiFi"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newLocal.description}
                    onChange={(e) => setNewLocal({...newLocal, description: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    rows="3"
                    placeholder="Description du local..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newLocal.site_id}
                    onChange={e => setNewLocal({ ...newLocal, site_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner un site</option>
                    {sites.map(site => (
                      <option key={site.id || site.site_id} value={site.id || site.site_id}>{site.nom || site.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={() => setShowAddLocalModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddLocal}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ajouter le local
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;

