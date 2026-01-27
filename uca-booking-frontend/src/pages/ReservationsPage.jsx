import React, { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Check, X, MessageSquare, Filter, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { reservations as initialReservations } from '../data/reservations';

const ReservationsPage = () => {
  const [reservations, setReservations] = useState(initialReservations);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSite, setFilterSite] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleAccept = (id) => {
    setReservations(reservations.map(r => 
      r.id === id ? { ...r, status: 'confirmed' } : r
    ));
  };

  const handleRefuse = (id) => {
    setReservations(reservations.map(r => 
      r.id === id ? { ...r, status: 'refused' } : r
    ));
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">En attente</span>;
      case 'confirmed':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Confirmée</span>;
      case 'refused':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Refusée</span>;
      case 'cancelled':
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Annulée</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  // Filtrer les réservations
  const filteredReservations = reservations.filter(r => {
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchSite = filterSite === 'all' || r.site === filterSite;
    const matchSearch = 
      r.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.local.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSite && matchSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReservations = filteredReservations.slice(startIndex, startIndex + itemsPerPage);

  return (
    <AdminLayout>
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-amber-800 mb-2"> Gestion des Réservations</h2>
          <p className="text-gray-600">Gérez et validez les demandes de réservation</p>
        </div>

        {/* Filtres et recherche */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
            <option value="pending">En attente</option>
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

          <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filtrer</span>
          </button>
        </div>

        {/* Tableau des réservations */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">DEMANDEUR</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">LOCAL</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">DATE</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">CRÉNEAU</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">STATUT</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedReservations.map((reservation) => (
                <tr key={reservation.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{reservation.user}</p>
                      <p className="text-sm text-gray-500">{reservation.email}</p>
                      <p className="text-xs text-gray-400">{reservation.fonction}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{reservation.local}</p>
                      <p className="text-sm text-gray-500">{reservation.site}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{reservation.date}</p>
                      {reservation.dateFin !== reservation.dateDebut && (
                        <p className="text-xs text-gray-500">au {reservation.dateFin}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm text-gray-900">{reservation.creneau}</p>
                      <p className="text-xs text-gray-500">{reservation.heureDebut} - {reservation.heureFin}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {getStatusBadge(reservation.status)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex space-x-2">
                      {reservation.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAccept(reservation.id)}
                            className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                            title="Accepter"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRefuse(reservation.id)}
                            className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            title="Refuser"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        className="p-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                        title="Ajouter un commentaire"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-600">
            Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredReservations.length)} sur {filteredReservations.length} réservations
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

export default ReservationsPage;