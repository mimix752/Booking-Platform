import { api } from '../utils/apiClient';

export async function getAdminLogs(params = {}) {
  const { data } = await api.get('/admin/logs', { params });
  if (!data?.success) {
    throw new Error(data?.message || 'Erreur lors du chargement des logs');
  }
  return data;
}

