import { api } from '../utils/apiClient';

export async function getLocalCalendar(localId, params = {}) {
  const { data } = await api.get(`/locaux/${localId}/calendar`, { params });
  if (!data?.success) {
    throw new Error(data?.message || 'Erreur lors du chargement du calendrier');
  }
  return data;
}

