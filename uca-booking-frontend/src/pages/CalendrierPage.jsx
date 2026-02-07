import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getAdminLocaux } from '../services/adminLocauxService';
import { getAdminReservations } from '../services/adminReservationService';
import { getLocalCalendar } from '../services/adminLocauxCalendarService';

const CalendrierPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedLocal, setSelectedLocal] = useState('all');
  const [viewMode, setViewMode] = useState('month'); // month, week
  const [locaux, setLocaux] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  
  const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const loadLocaux = async () => {
    const res = await getAdminLocaux();
    const data = res?.data || [];
    setLocaux(data);
  };

  const loadReservations = async () => {
    setLoading(true);
    setError('');
    try {
      if (selectedLocal === 'all') {
        const res = await getAdminReservations({ limit: 200 });
        setReservations(res?.data || []);
      } else {
        const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const res = await getLocalCalendar(selectedLocal, {
          start_date: start.toISOString().slice(0, 10),
          end_date: end.toISOString().slice(0, 10),
        });
        setReservations(res?.data || []);
      }
    } catch (e) {
      setError(e?.message || 'Erreur lors du chargement du calendrier');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocaux().catch(() => {});
  }, []);

  useEffect(() => {
    loadReservations();
  }, [selectedLocal, currentDate]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    
    return { daysInMonth, startingDayOfWeek };
  };

  const normalizedReservations = useMemo(() => {
    return (reservations || []).map((r) => ({
      id: r.id,
      user: r.user?.name || '',
      local: r.local?.nom || '',
      dateDebut: r.date_debut,
      dateFin: r.date_fin,
      status: r.statut,
      creneau: r.creneau,
    }));
  }, [reservations]);

  const getReservationsForDay = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return normalizedReservations.filter(r => {
      return (r.dateDebut <= dateStr && r.dateFin >= dateStr);
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const getStatusColor = (status) => {
    switch (status) {
      case 'en_attente':
        return 'bg-yellow-100 border-yellow-400 text-yellow-800';
      case 'confirmee':
        return 'bg-green-100 border-green-400 text-green-800';
      case 'refusee':
        return 'bg-red-100 border-red-400 text-red-800';
      case 'annulee_admin':
      case 'annulee_utilisateur':
        return 'bg-gray-100 border-gray-400 text-gray-800';
      default:
        return 'bg-gray-100 border-gray-400 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-amber-800 mb-2">Calendrier des Réservations</h2>
          <p className="text-gray-600">Visualisez les réservations par date</p>
        </div>

        {/* Contrôles du calendrier */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={previousMonth}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-semibold text-gray-900 min-w-[180px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <button
              onClick={nextMonth}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-amber-800 text-white rounded-lg hover:bg-amber-900 transition-colors"
            >
              Aujourd'hui
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={selectedLocal}
              onChange={(e) => setSelectedLocal(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Tous les locaux</option>
              {locaux.map((local) => (
                <option key={local.id} value={String(local.id)}>
                  {local.nom}
                </option>
              ))}
            </select>

            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'month' ? 'bg-white text-amber-800 shadow-sm' : 'text-gray-600'
                }`}
              >
                Mois
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'week' ? 'bg-white text-amber-800 shadow-sm' : 'text-gray-600'
                }`}
              >
                Semaine
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">{error}</div>
        )}

        {loading && (
          <div className="mb-4 text-sm text-gray-500">Chargement…</div>
        )}

        {/* Légende */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-400 rounded"></div>
            <span className="text-sm text-gray-700">En attente</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-400 rounded"></div>
            <span className="text-sm text-gray-700">Confirmée</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-100 border-2 border-red-400 rounded"></div>
            <span className="text-sm text-gray-700">Refusée</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-100 border-2 border-gray-400 rounded"></div>
            <span className="text-sm text-gray-700">Annulée</span>
          </div>
        </div>

        {/* Calendrier */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* En-tête des jours */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {daysOfWeek.map(day => (
              <div key={day} className="p-3 text-center font-semibold text-gray-700 text-sm">
                {day}
              </div>
            ))}
          </div>

          {/* Grille du calendrier */}
          <div className="grid grid-cols-7">
            {/* Jours vides du début */}
            {[...Array(startingDayOfWeek)].map((_, index) => (
              <div key={`empty-${index}`} className="min-h-[120px] bg-gray-50 border-b border-r border-gray-200"></div>
            ))}

            {/* Jours du mois */}
            {[...Array(daysInMonth)].map((_, index) => {
              const day = index + 1;
              const dayReservations = getReservationsForDay(day);
              const today = new Date();
              const isToday =
                day === today.getDate() &&
                currentDate.getMonth() === today.getMonth() &&
                currentDate.getFullYear() === today.getFullYear();

              return (
                <div
                  key={day}
                  className={`min-h-[120px] border-b border-r border-gray-200 p-2 ${
                    isToday ? 'bg-amber-50' : 'bg-white'
                  }`}
                >
                  <div
                    className={`text-sm font-semibold mb-2 ${
                      isToday ? 'text-amber-800' : 'text-gray-700'
                    }`}
                  >
                    {day}
                    {isToday && <span className="ml-2 text-xs text-amber-600">(Aujourd'hui)</span>}
                  </div>

                  <div className="space-y-1">
                    {dayReservations.slice(0, 3).map((reservation) => (
                      <div
                        key={reservation.id}
                        className={`text-xs p-1 rounded border-l-2 ${getStatusColor(reservation.status)}`}
                        title={`${reservation.local} - ${reservation.user} - ${reservation.creneau}`}
                      >
                        <p className="font-medium truncate">{reservation.local || 'Local'}</p>
                        <p className="truncate text-[10px]">{reservation.creneau}</p>
                      </div>
                    ))}
                    {dayReservations.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayReservations.length - 3} autre(s)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Statistiques du mois */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-2xl font-bold text-yellow-800">
              {normalizedReservations.filter((r) => r.status === 'en_attente').length}
            </p>
            <p className="text-sm text-yellow-700">En attente</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-2xl font-bold text-green-800">
              {normalizedReservations.filter((r) => r.status === 'confirmee').length}
            </p>
            <p className="text-sm text-green-700">Confirmées</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-2xl font-bold text-red-800">
              {normalizedReservations.filter((r) => r.status === 'refusee').length}
            </p>
            <p className="text-sm text-red-700">Refusées</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-2xl font-bold text-gray-800">
              {normalizedReservations.filter(
                (r) => r.status === 'annulee_admin' || r.status === 'annulee_utilisateur'
              ).length}
            </p>
            <p className="text-sm text-gray-700">Annulées</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CalendrierPage;
