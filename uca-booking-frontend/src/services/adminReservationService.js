import { api } from '../utils/apiClient';

export async function getAdminReservations(params = {}) {
  const { data } = await api.get('/admin/reservations', { params });
  if (!data?.success) {
    throw new Error(data?.message || 'Erreur lors du chargement des réservations');
  }
  return data;
}

export async function validateAdminReservation(id, commentaire_admin = '') {
  const { data } = await api.post(`/admin/reservations/${id}/validate`, { commentaire_admin });
  if (!data?.success) {
    throw new Error(data?.message || 'Erreur lors de la validation');
  }
  return data;
}

export async function refuseAdminReservation(id, commentaire_admin) {
  const { data } = await api.post(`/admin/reservations/${id}/refuse`, { commentaire_admin });
  if (!data?.success) {
    throw new Error(data?.message || 'Erreur lors du refus');
  }
  return data;
}

export async function getReservationHistory(params = {}) {
  const { data } = await api.get('/admin/reservation-histories', { params });
  if (!data?.success) {
    throw new Error(data?.message || 'Erreur lors du chargement de l\'historique');
  }
  return data;
}
