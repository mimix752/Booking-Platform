import React, { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Search, Download, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { reservations as allReservations } from '../data/reservations';

const HistoriquePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSite, setFilterSite] = useState('all');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Filtrer seulement les réservations passées ou traitées
  const historique = allReservations.filter(r => 
    r.status === 'confirmed' || r.status === 'refused' || r.status === 'cancelled'
  );

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

  // Filtrer l'historique
  const filteredHistorique = historique.filter(r => {
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchSite = filterSite === 'all' || r.site === filterSite;
    const matchSearch = 
      r.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.local.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.motif.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchDate = true;
    if (dateDebut && dateFin) {
      const resDate = new Date(r.date);
      matchDate = resDate >= new Date(dateDebut) && resDate <= new Date(dateFin);
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

        {/* Statistiques rapides */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-2xl font-bold text-green-800">
              {historique.filter(r => r.status === 'confirmed').length}
            </p>
            <p className="text-sm text-green-700">Réservations confirmées</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-2xl font-bold text-red-800">
              {historique.filter(r => r.status === 'refused').length}
            </p>
            <p className="text-sm text-red-700">Réservations refusées</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-2xl font-bold text-gray-800">
              {historique.filter(r => r.status === 'cancelled').length}
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
                      <p className="font-medium text-gray-900">{reservation.date}</p>
                      <p className="text-xs text-gray-500">{reservation.heureDebut} - {reservation.heureFin}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{reservation.user}</p>
                      <p className="text-xs text-gray-500">{reservation.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{reservation.local}</p>
                      <p className="text-xs text-gray-500">{reservation.site}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-700">{reservation.motif}</p>
                    <p className="text-xs text-gray-500">{reservation.event}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium text-gray-900">{reservation.participants}</p>
                  </td>
                  <td className="px-4 py-4">
                    {getStatusBadge(reservation.status)}
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-xs text-gray-600 max-w-xs truncate">
                      {reservation.commentaire || '-'}
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
      </div>
    </AdminLayout>
  );
};

export default HistoriquePage;