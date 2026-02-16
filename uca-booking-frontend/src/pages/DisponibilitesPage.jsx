import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowLeft, Calendar } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getLocalCalendar } from '../services/adminLocauxCalendarService';
import { api } from '../utils/apiClient';

const monthNames = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const DisponibilitesPage = () => {
  const { localId } = useParams();
  const navigate = useNavigate();

  const [localInfo, setLocalInfo] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load room info
  useEffect(() => {
    const loadLocal = async () => {
      try {
        const { data } = await api.get(`/locaux/${localId}`);
        if (data?.success) {
          setLocalInfo(data.data);
        }
      } catch {
        // ignore — calendar still works
      }
    };
    loadLocal();
  }, [localId]);

  // Load reservations for the current month
  useEffect(() => {
    const loadReservations = async () => {
      setLoading(true);
      setError('');
      try {
        const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const res = await getLocalCalendar(localId, {
          start_date: start.toISOString().slice(0, 10),
          end_date: end.toISOString().slice(0, 10),
        });
        setReservations(res?.data || []);
      } catch (e) {
        setError(e?.message || 'Erreur lors du chargement des disponibilités');
      } finally {
        setLoading(false);
      }
    };
    loadReservations();
  }, [localId, currentDate]);

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
      dateDebut: r.date_debut,
      dateFin: r.date_fin,
      status: r.statut,
      creneau: r.creneau,
    }));
  }, [reservations]);

  const getReservationsForDay = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return normalizedReservations.filter((r) => r.dateDebut <= dateStr && r.dateFin >= dateStr);
  };

  const previousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const getCreneauLabel = (creneau) => {
    switch (creneau) {
      case 'matin': return 'Matin';
      case 'apres-midi': return 'Après-midi';
      case 'journee-complete': return 'Journée complète';
      default: return creneau;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'en_attente':
        return 'bg-orange-100 border-orange-400 text-orange-800';
      case 'confirmee':
        return 'bg-red-100 border-red-400 text-red-700';
      default:
        return 'bg-gray-100 border-gray-400 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'en_attente': return 'En attente';
      case 'confirmee': return 'Occupé';
      default: return status;
    }
  };

  // For each day, determine overall availability
  const getDayAvailability = (day) => {
    const dayRes = getReservationsForDay(day);
    if (dayRes.length === 0) return 'free';
    const hasJournee = dayRes.some((r) => r.creneau === 'journee-complete');
    const hasMatin = dayRes.some((r) => r.creneau === 'matin');
    const hasApresMidi = dayRes.some((r) => r.creneau === 'apres-midi');
    if (hasJournee || (hasMatin && hasApresMidi)) return 'full';
    return 'partial';
  };

  const roomName = localInfo?.nom || `Salle #${localId}`;

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back + title */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux locaux
          </button>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Disponibilités — {roomName}
          </h2>
          <p className="text-gray-500">
            Consultez le calendrier pour voir les créneaux disponibles avant de réserver.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          {/* Controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex items-center space-x-4">
              <button onClick={previousMonth} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-semibold text-gray-900 min-w-[200px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <button onClick={nextMonth} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
              >
                Aujourd'hui
              </button>
            </div>

            <button
              onClick={() => navigate(`/reservation/${localId}`)}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 font-medium text-sm"
            >
              <Calendar className="w-4 h-4" />
              Réserver cette salle
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">{error}</div>
          )}

          {loading && (
            <div className="mb-4 text-sm text-gray-500">Chargement...</div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-white border-2 border-gray-200 rounded"></div>
              <span className="text-sm text-gray-700">Disponible</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-100 border-2 border-orange-400 rounded"></div>
              <span className="text-sm text-gray-700">En attente de confirmation</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-100 border-2 border-red-400 rounded"></div>
              <span className="text-sm text-gray-700">Occupé</span>
            </div>
          </div>

          {/* Calendar */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
              {daysOfWeek.map((day) => (
                <div key={day} className="p-3 text-center font-semibold text-gray-700 text-sm">
                  {day}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7">
              {/* Empty leading cells */}
              {[...Array(startingDayOfWeek)].map((_, index) => (
                <div key={`empty-${index}`} className="min-h-[120px] bg-gray-50 border-b border-r border-gray-200" />
              ))}

              {/* Day cells */}
              {[...Array(daysInMonth)].map((_, index) => {
                const day = index + 1;
                const dayReservations = getReservationsForDay(day);
                const today = new Date();
                const isToday =
                  day === today.getDate() &&
                  currentDate.getMonth() === today.getMonth() &&
                  currentDate.getFullYear() === today.getFullYear();
                const availability = getDayAvailability(day);

                let bgClass = 'bg-white';
                if (isToday) bgClass = 'bg-blue-50';
                else if (availability === 'full') bgClass = 'bg-red-50/40';

                return (
                  <div
                    key={day}
                    className={`min-h-[120px] border-b border-r border-gray-200 p-2 ${bgClass}`}
                  >
                    <div className={`text-sm font-semibold mb-2 ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>
                      {day}
                      {isToday && <span className="ml-2 text-xs text-blue-500">(Aujourd'hui)</span>}
                    </div>

                    <div className="space-y-1">
                      {dayReservations.length === 0 && (
                        <div className="text-[10px] text-green-600 font-medium">Disponible</div>
                      )}
                      {dayReservations.slice(0, 3).map((reservation) => (
                        <div
                          key={reservation.id}
                          className={`text-xs p-1.5 rounded border-l-2 ${getStatusColor(reservation.status)}`}
                          title={`${getCreneauLabel(reservation.creneau)} — ${getStatusLabel(reservation.status)}`}
                        >
                          <p className="font-medium truncate">{getCreneauLabel(reservation.creneau)}</p>
                          <p className="truncate text-[10px] opacity-75">{getStatusLabel(reservation.status)}</p>
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

          {/* Summary for the month */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
              <p className="text-2xl font-bold text-green-800">
                {[...Array(daysInMonth)].filter((_, i) => getDayAvailability(i + 1) === 'free').length}
              </p>
              <p className="text-sm text-green-700">Jours entièrement libres</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 text-center">
              <p className="text-2xl font-bold text-orange-800">
                {[...Array(daysInMonth)].filter((_, i) => getDayAvailability(i + 1) === 'partial').length}
              </p>
              <p className="text-sm text-orange-700">Jours partiellement occupés</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200 text-center">
              <p className="text-2xl font-bold text-red-800">
                {[...Array(daysInMonth)].filter((_, i) => getDayAvailability(i + 1) === 'full').length}
              </p>
              <p className="text-sm text-red-700">Jours complets</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default DisponibilitesPage;
