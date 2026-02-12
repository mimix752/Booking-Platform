import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Search, Download, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { getReservationHistory, getAdminReservations } from '../services/adminReservationService';

const HistoriquePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSite, setFilterSite] = useState('all');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const itemsPerPage = 15;

  // Charger les données depuis le backend au montage
  useEffect(() => {
    fetchHistorique();
  }, []);

  const fetchHistorique = async () => {
    try {
      setLoading(true);
      setError(null);

      let historiqueData = [];

      try {
        // Essayer d'abord l'endpoint dédié reservation-histories
        const response = await getReservationHistory();
        console.log('✅ Réponse du backend (reservation_histories):', response);

        historiqueData = response?.data?.data || response?.data || [];
      } catch (historyError) {
        console.warn('⚠️ Endpoint reservation-histories non disponible, utilisation du fallback');
        console.warn('Détails:', historyError.message);

        // FALLBACK: utiliser l'endpoint des réservations standard
        try {
          const response = await getAdminReservations();
          console.log('📋 Réponse du backend (reservations standard):', response);

          const allReservations = response?.data?.data || response?.data || [];

          // Filtrer pour ne garder que les réservations traitées
          historiqueData = allReservations.filter(r => {
            const status = r.status || r.statut || '';
            return status === 'confirmed' || status === 'refused' || status === 'cancelled';
          });

          console.log('📊 Filtrage effectué - Réservations traitées:', historiqueData.length);
        } catch (fallbackError) {
          throw new Error('Impossible de charger les données: ' + fallbackError.message);
        }
      }

      // S'assurer que c'est un array
      if (!Array.isArray(historiqueData)) {
        console.error('❌ Les données reçues ne sont pas un tableau:', historiqueData);
        historiqueData = [];
      }

      console.log('📈 Total historique final:', historiqueData.length);
      if (historiqueData.length > 0) {
        console.log('📄 Exemple de données:', historiqueData[0]);
      }

      setHistorique(historiqueData);
    } catch (err) {
      console.error('❌ Erreur lors du chargement de l\'historique:', err);
      setError(err.message || 'Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'confirmed':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">✓ Confirmée</span>;
      case 'refused':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">✗ Refusée</span>;
      case 'cancelled':
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">⊗ Annulée</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  // Filtrer l'historique selon les critères de l'utilisateur
  const filteredHistorique = historique.filter(r => {
    const status = r.status || r.statut || '';
    const matchStatus = filterStatus === 'all' || status === filterStatus;
    const matchSite = filterSite === 'all' || (r.site || r.lieu || '').toLowerCase() === filterSite.toLowerCase();
    const matchSearch =
      (r.user || r.nom_demandeur || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.local || r.salle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.email || r.email_demandeur || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.motif || r.raison || '').toLowerCase().includes(searchTerm.toLowerCase());

    let matchDate = true;
    if (dateDebut && dateFin) {
      const resDate = new Date(r.date || r.date_debut);
      const start = new Date(dateDebut);
      const end = new Date(dateFin);
      matchDate = resDate >= start && resDate <= end;
    }

    return matchStatus && matchSite && matchSearch && matchDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredHistorique.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHistorique = filteredHistorique.slice(startIndex, startIndex + itemsPerPage);

  const handleExport = () => {
    alert('Exportation en cours... (Fonctionnalité à implémenter)');
  };

  return (
    <AdminLayout>
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-amber-800 mb-2">Historique des Réservations</h2>
            <p className="text-gray-600">Consultez l'historique complet des réservations traitées</p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exporter</span>
          </button>
        </div>

        {/* Écran de chargement */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800 mx-auto mb-4"></div>
            <p className="text-gray-500">Chargement de l'historique...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
            <p className="text-red-800 font-semibold mb-2">❌ Erreur</p>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={fetchHistorique}
              className="px-4 py-2 bg-red-800 text-white rounded hover:bg-red-900 transition-colors"
            >
              Réessayer
            </button>
          </div>
        ) : historique.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Aucune réservation traitée dans l'historique</p>
            <p className="text-gray-400 text-sm mt-2">Les réservations confirmées, refusées ou annulées s'afficheront ici</p>
          </div>
        ) : (
          <>
            {/* Statistiques rapides */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-2xl font-bold text-green-800">
                  {historique.filter(r => (r.status || r.statut) === 'confirmed').length}
                </p>
                <p className="text-sm text-green-700">Réservations confirmées</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-2xl font-bold text-red-800">
                  {historique.filter(r => (r.status || r.statut) === 'refused').length}
                </p>
                <p className="text-sm text-red-700">Réservations refusées</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-2xl font-bold text-gray-800">
                  {historique.filter(r => (r.status || r.statut) === 'cancelled').length}
                </p>
                <p className="text-sm text-gray-700">Réservations annulées</p>
              </div>
            </div>

            {/* Filtres */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="confirmed">Confirmées</option>
                <option value="refused">Refusées</option>
                <option value="cancelled">Annulées</option>
              </select>

              <select
                value={filterSite}
                onChange={(e) => setFilterSite(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">Tous les sites</option>
                <option value="Présidence">Présidence</option>
                <option value="Cité d'Innovation">Cité d'Innovation</option>
                <option value="Centre de Conférences">Centre de Conférences</option>
                <option value="Bibliothèque">Bibliothèque</option>
              </select>

              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="Date début"
              />

              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="Date fin"
              />
            </div>

            {/* Tableau historique */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">DATE</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">DEMANDEUR</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">LOCAL</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">MOTIF</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">PARTICIPANTS</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">STATUT</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">COMMENTAIRE</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedHistorique.map((reservation) => (
                    <tr key={reservation.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          {/* Affiche date + heure début/fin sur une seule ligne */}
                          <p className="font-medium text-gray-900">
                            {(() => {
                              const date = reservation.date || reservation.date_debut;
                              const heureDebut = reservation.heureDebut || reservation.heure_debut;
                              const heureFin = reservation.heureFin || reservation.heure_fin;
                              if (!date) return '-';
                              // Format date (jj/mm/aaaa)
                              const d = new Date(date);
                              const dateStr = !isNaN(d.getTime()) ? `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}` : date;
                              // Affiche date + heure
                              if (heureDebut && heureFin) {
                                return `${dateStr} ${heureDebut} - ${heureFin}`;
                              } else if (heureDebut) {
                                return `${dateStr} ${heureDebut}`;
                              } else {
                                return dateStr;
                              }
                            })()}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{reservation.user || reservation.nom_demandeur}</p>
                          <p className="text-xs text-gray-500">{reservation.email || reservation.email_demandeur}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{reservation.local || reservation.salle}</p>
                          <p className="text-xs text-gray-500">{reservation.site || reservation.lieu}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-700">{reservation.motif || reservation.raison}</p>
                        <p className="text-xs text-gray-500">{reservation.event || reservation.type_reunion}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-gray-900">{reservation.participants || reservation.nombre_participants}</p>
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(reservation.status || reservation.statut)}
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs text-gray-600 max-w-xs truncate">
                          {reservation.commentaire || reservation.commentaire_admin || '-'}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {paginatedHistorique.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun résultat trouvé</p>
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-600">
                Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredHistorique.length)} sur {filteredHistorique.length} réservations
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center space-x-1 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Précédent</span>
                </button>
                <span className="px-4 py-2 text-sm text-gray-700">
                  Page {currentPage} sur {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center space-x-1 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Suivant</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default HistoriquePage;

