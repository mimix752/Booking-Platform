import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Search, Calendar, CheckCircle, XCircle, AlertCircle, Eye, Trash2 } from 'lucide-react';
import { getAdminReservations, validateAdminReservation, refuseAdminReservation } from '../services/adminReservationService';
import { getSites } from '../services/publicDataService';

const ReservationsPage = () => {
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [siteFilter, setSiteFilter] = useState('all');
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [sites, setSites] = useState([]);

  useEffect(() => {
    loadReservations();
    loadFiltersData();
  }, []);

  useEffect(() => {
    filterReservations();
  }, [reservations, searchTerm, statusFilter, siteFilter]);

  const loadFiltersData = async () => {
    try {
      const sitesArr = await getSites();
      setSites(Array.isArray(sitesArr) ? sitesArr : []);
    } catch {
      setSites([]);
    }
  };

  const loadReservations = async () => {
    try {
      // Charger toutes les réservations (admin)
      const res = await getAdminReservations({ limit: 200 });
      const all = res?.data || [];

      const normalized = all.map((r) => ({
        id: r.id,
        status: r.statut,
        userName: r.user?.name || '',
        userEmail: r.user?.email || '',
        userId: String(r.user_id ?? r.user?.id ?? ''),
        dateDebut: r.date_debut,
        dateFin: r.date_fin,
        creneau: r.creneau,
        participants: r.participants_estimes,
        motif: r.motif || '',
        site: r.local?.site?.nom || '',
        siteId: String(r.local?.site?.id ?? ''),
        localNom: r.local?.nom || '',
        localId: String(r.local_id ?? r.local?.id ?? ''),
        dateCreation: r.created_at,
        raw: r,
      }));

      const sortedReservations = normalized.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));
      setReservations(sortedReservations);
    } catch (e) {
      console.error(e);
      alert(e?.message || 'Erreur lors du chargement des réservations');
      setReservations([]);
    }
  };

  const filterReservations = () => {
    let filtered = reservations;

    if (searchTerm) {
      filtered = filtered.filter(res =>
        res.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (res.motif || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(res => res.status === statusFilter);
    }

    if (siteFilter !== 'all') {
      // siteFilter peut être un id (select) => on compare avec siteId si dispo, sinon fallback sur le nom.
      filtered = filtered.filter(res => res.siteId === String(siteFilter) || res.site === siteFilter);
    }

    setFilteredReservations(filtered);
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'confirmee':
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-600" />,
          label: 'Confirmée',
          bgColor: 'bg-green-50',
          textColor: 'text-green-800',
          borderColor: 'border-green-200'
        };
      case 'en_attente':
        return {
          icon: <AlertCircle className="w-4 h-4 text-yellow-600" />,
          label: 'En attente',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200'
        };
      case 'refusee':
        return {
          icon: <XCircle className="w-4 h-4 text-red-600" />,
          label: 'Refusée',
          bgColor: 'bg-red-50',
          textColor: 'text-red-800',
          borderColor: 'border-red-200'
        };
      case 'annulee':
        return {
          icon: <XCircle className="w-4 h-4 text-gray-600" />,
          label: 'Annulée',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        };
      default:
        return {
          icon: <AlertCircle className="w-4 h-4 text-gray-600" />,
          label: 'Inconnu',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        };
    }
  };

  const handleStatusChange = async (reservationId, newStatus) => {
    try {
      if (newStatus === 'confirmee') {
        await validateAdminReservation(reservationId);
      } else if (newStatus === 'refusee') {
        // The backend requires commentaire_admin min length 10
        const reason = window.prompt('Motif du refus (min 10 caractères):');
        if (!reason) return;
        await refuseAdminReservation(reservationId, reason);
      }
      await loadReservations();
    } catch (e) {
      console.error(e);
      alert(e?.message || 'Erreur lors du changement de statut');
    }
  };

  const handleDeleteReservation = () => {
    alert('La suppression n\'est pas implémentée côté API. Utilisez Annuler dans le backend si besoin.');
  };

  const openModal = (_type, reservation = null) => {
    setSelectedReservation(reservation);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedReservation(null);
  };

  const getCreneauLabel = (creneau) => {
    switch (creneau) {
      case 'matin': return 'Matin (8h-12h)';
      case 'apres-midi': return 'Après-midi (14h-18h)';
      case 'journee': return 'Journée complète';
      default: return creneau;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header et statistiques */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestion des réservations</h2>
              <p className="text-gray-600">Gérez toutes les demandes de réservation</p>
            </div>
          </div>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{reservations.length}</div>
              <div className="text-sm text-blue-800">Total</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {reservations.filter(r => r.status === 'confirmee').length}
              </div>
              <div className="text-sm text-green-800">Confirmées</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {reservations.filter(r => r.status === 'en_attente').length}
              </div>
              <div className="text-sm text-yellow-800">En attente</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {reservations.filter(r => r.status === 'refusee').length}
              </div>
              <div className="text-sm text-red-800">Refusées</div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Nom, email, motif..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:border-amber-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-800"
              >
                <option value="all">Tous les statuts</option>
                <option value="en_attente">En attente</option>
                <option value="confirmee">Confirmées</option>
                <option value="refusee">Refusées</option>
                <option value="annulee">Annulées</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
              <select
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-800"
              >
                <option value="all">Tous les sites</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>{site.nom || site.name || site.site_id || site.id}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setSiteFilter('all');
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors w-full"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Table des réservations */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Local & Site
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Période
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReservations.map((reservation) => {
                  const statusInfo = getStatusInfo(reservation.status);

                  return (
                    <tr key={reservation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {reservation.userName}
                          </div>
                          <div className="text-sm text-gray-500">{reservation.userId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {reservation.localNom || 'Local'}
                          </div>
                          <div className="text-sm text-gray-500">{reservation.site || 'Site'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {reservation.dateDebut}
                          {reservation.dateFin !== reservation.dateDebut && ` au ${reservation.dateFin}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getCreneauLabel(reservation.creneau)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.borderColor} border`}>
                          {statusInfo.icon}
                          <span className={`text-sm font-medium ${statusInfo.textColor}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openModal('view', reservation)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {reservation.status === 'en_attente' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(reservation.id, 'confirmee')}
                                className="text-green-600 hover:text-green-800 transition-colors"
                                title="Confirmer"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleStatusChange(reservation.id, 'refusee')}
                                className="text-red-600 hover:text-red-800 transition-colors"
                                title="Refuser"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => handleDeleteReservation(reservation.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredReservations.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune réservation trouvée</h3>
              <p className="text-gray-500">Aucune réservation ne correspond aux filtres sélectionnés.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de détails */}
      {showModal && selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-gray-900">Détails de la réservation</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Informations utilisateur */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Utilisateur</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Nom :</span>
                        <span className="ml-2">{selectedReservation.userName}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Email :</span>
                        <span className="ml-2">{selectedReservation.userId}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Fonction :</span>
                        <span className="ml-2">{selectedReservation.fonction}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Participants :</span>
                        <span className="ml-2">{selectedReservation.participants} personnes</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informations réservation */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Réservation</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Local :</span>
                        <span className="ml-2">{selectedReservation.localNom || '-'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Site :</span>
                        <span className="ml-2">{selectedReservation.site || '-'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Date début :</span>
                        <span className="ml-2">{selectedReservation.dateDebut}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Date fin :</span>
                        <span className="ml-2">{selectedReservation.dateFin}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Créneau :</span>
                        <span className="ml-2">{getCreneauLabel(selectedReservation.creneau)}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Nature :</span>
                        <span className="ml-2">{selectedReservation.natureEvenement}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Motif */}
                {selectedReservation.motif && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Motif</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700">{selectedReservation.motif}</p>
                    </div>
                  </div>
                )}

                {/* Actions pour les demandes en attente */}
                {selectedReservation.status === 'en_attente' && (
                  <div className="flex justify-center space-x-4 pt-4">
                    <button
                      onClick={() => {
                        handleStatusChange(selectedReservation.id, 'confirmee');
                        closeModal();
                      }}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Confirmer la réservation
                    </button>
                    <button
                      onClick={() => {
                        handleStatusChange(selectedReservation.id, 'refusee');
                        closeModal();
                      }}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Refuser la réservation
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ReservationsPage;

