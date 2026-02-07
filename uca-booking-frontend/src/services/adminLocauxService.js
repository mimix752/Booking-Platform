import { api } from '../utils/apiClient';

export async function getAdminLocaux(params = {}) {
  // Pas d’endpoint admin spécifique pour lister les locaux: on réutilise /locaux
  const { data } = await api.get('/locaux', { params });
  if (!data?.success) {
    throw new Error(data?.message || 'Erreur lors du chargement des locaux');
  }
  return data;
}

export async function setLocalMaintenance(localId, maintenance) {
  const { data } = await api.post(`/admin/locaux/${localId}/maintenance`, { maintenance: !!maintenance });
  if (!data?.success) {
    throw new Error(data?.message || 'Erreur lors de la mise en maintenance');
  }
  return data;
}
