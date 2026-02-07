import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Calendar, MapPin, Users, Clock, CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react';
import { sites } from '../data/sites';
import { locaux } from '../data/locaux';
import { getMyReservations, cancelReservation } from '../services/reservationService';

const MesReservationsPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const loadReservations = async () => {
      try {
        const data = await getMyReservations();
        setReservations(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadReservations();
  }, [isAuthenticated, navigate]);

  const getStatusInfo = (status) => {
    switch (status) {
      case 'confirmee':
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          label: 'Confirmée',
          bgColor: 'bg-green-50',
          textColor: 'text-green-800',
          borderColor: 'border-green-200'
        };
      case 'en_attente':
        return {
          icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
          label: 'En attente',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200'
        };
      case 'refusee':
        return {
          icon: <XCircle className="w-5 h-5 text-red-600" />,
          label: 'Refusée',
          bgColor: 'bg-red-50',
          textColor: 'text-red-800',
          borderColor: 'border-red-200'
        };
      case 'annulee':
        return {
          icon: <XCircle className="w-5 h-5 text-gray-600" />,
          label: 'Annulée',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        };
      default:
        return {
          icon: <AlertCircle className="w-5 h-5 text-gray-600" />,
          label: 'Inconnu',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        };
    }
  };

  const getCreneauLabel = (creneau) => {
    switch (creneau) {
      case 'matin':
        return 'Matin (8h-12h)';
      case 'apres-midi':
        return 'Après-midi (14h-18h)';
      case 'journee':
        return 'Journée complète';
      default:
        return creneau;
    }
  };

  const handleAnnulerReservation = async (reservationId) => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      try {
        await cancelReservation(reservationId);
        const data = await getMyReservations();
        setReservations(data);
      } catch (e) {
        console.error(e);
        alert(e?.message || 'Erreur lors de l\'annulation');
      }
    }
  };

  const canCancelReservation = (reservation) => {
    if (reservation.status === 'annulee' || reservation.status === 'refusee') {
      return false;
    }

    // Vérifier si c'est moins de 12h avant la date de début
    const now = new Date();
    const startDate = new Date(reservation.dateDebut);
    const timeDiff = startDate.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);

    return hoursDiff > 12;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos réservations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-amber-800 hover:text-amber-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Retour à l'accueil
            </button>

            <div className="flex items-center space-x-4">
              {user?.picture && (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div className="text-right">
                <p className="font-medium text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes réservations</h1>
          <p className="text-gray-600">Consultez et gérez l'historique de vos réservations</p>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{reservations.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-green-600">
              {reservations.filter(r => r.status === 'confirmee').length}
            </div>
            <div className="text-sm text-gray-600">Confirmées</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-yellow-600">
              {reservations.filter(r => r.status === 'en_attente').length}
            </div>
            <div className="text-sm text-gray-600">En attente</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-red-600">
              {reservations.filter(r => r.status === 'refusee').length}
            </div>
            <div className="text-sm text-gray-600">Refusées</div>
          </div>
        </div>

        {/* Liste des réservations */}
        {reservations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune réservation</h3>
            <p className="text-gray-600 mb-6">Vous n'avez encore effectué aucune réservation.</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-amber-800 text-white rounded-lg hover:bg-amber-900 transition-colors"
            >
              Découvrir nos locaux
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map((reservation) => {
              const local = locaux.find(l => l.id === reservation.localId);
              const site = sites.find(s => s.id === reservation.site);
              const statusInfo = getStatusInfo(reservation.status);

              return (
                <div key={reservation.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {local?.nom || 'Local supprimé'}
                        </h3>
                        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.borderColor} border`}>
                          {statusInfo.icon}
                          <span className={`text-sm font-medium ${statusInfo.textColor}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>{site?.name || 'Site inconnu'}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>
                            {reservation.dateDebut}
                            {reservation.dateFin !== reservation.dateDebut && ` au ${reservation.dateFin}`}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>{getCreneauLabel(reservation.creneau)}</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          <span>{reservation.participants} participants</span>
                        </div>
                      </div>

                      {reservation.motif && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <strong>Motif :</strong> {reservation.motif}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      <div className="text-xs text-gray-500">
                        Demandée le {new Date(reservation.dateCreation).toLocaleDateString('fr-FR')}
                      </div>

                      {canCancelReservation(reservation) && (
                        <button
                          onClick={() => handleAnnulerReservation(reservation.id)}
                          className="flex items-center space-x-1 px-3 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Annuler</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MesReservationsPage;
