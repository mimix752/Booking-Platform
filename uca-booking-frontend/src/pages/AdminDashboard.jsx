import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { Plus, Wrench, FileText, TrendingUp, Users, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    confirmees: 0,
    en_attente: 0,
    refusees: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allReservations = JSON.parse(localStorage.getItem('reservations') || '[]');
    setReservations(allReservations);

    // Calculer les statistiques
    const stats = {
      total: allReservations.length,
      confirmees: allReservations.filter(r => r.status === 'confirmee').length,
      en_attente: allReservations.filter(r => r.status === 'en_attente').length,
      refusees: allReservations.filter(r => r.status === 'refusee').length
    };
    setStats(stats);
  };

  const pendingReservations = reservations
    .filter(r => r.status === 'en_attente')
    .sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation))
    .slice(0, 5);

  const handleStatusChange = (reservationId, newStatus) => {
    const updatedReservations = reservations.map(res =>
      res.id === reservationId
        ? { ...res, status: newStatus, lastUpdated: new Date().toISOString() }
        : res
    );

    localStorage.setItem('reservations', JSON.stringify(updatedReservations));
    loadData(); // Recharger les données
  };

  return (
    <AdminLayout>
      {/* Statistiques Section */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
        <h2 className="text-3xl font-bold text-amber-800 mb-8">Tableau de bord</h2>

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
                  {stats.total > 0 ? Math.round((stats.confirmees / stats.total) * 100) : 0}%
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

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ajouter un local */}
        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Plus className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ajouter un local</h3>
          <p className="text-gray-600 text-sm mb-4">Enregistrez un nouveau local dans la base de données</p>
          <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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
          <p className="text-gray-600 text-sm mb-4">Exportez les statistiques au format PDF ou Excel</p>
          <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            Exporter
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;