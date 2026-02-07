import { api } from '../utils/apiClient';

export async function createReservation(payload) {
  try {
    const { data } = await api.post('/reservations', payload);
    if (!data?.success) {
      throw new Error(data?.message || 'Erreur lors de la création de la réservation');
    }
    return data.data;
  } catch (err) {
    // Axios error with backend JSON payload
    const status = err?.response?.status;
    const message = err?.response?.data?.message;
    const errors = err?.response?.data?.errors;

    if (status && (message || errors)) {
      const details = errors
        ? Object.entries(errors)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join(' | ')
        : null;

      throw new Error([message, details].filter(Boolean).join(' - '));
    }

    throw err;
  }
}

export async function getMyReservations(params = {}) {
  const { data } = await api.get('/reservations/my-reservations', { params });
  if (!data?.success) {
    throw new Error(data?.message || 'Erreur lors du chargement des réservations');
  }
  return data.data;
}

export async function cancelReservation(id, cancellation_reason) {
  const { data } = await api.post(`/reservations/${id}/cancel`, {
    cancellation_reason,
  });
  if (!data?.success) {
    throw new Error(data?.message || 'Erreur lors de l\'annulation');
  }
  return data.data;
}
