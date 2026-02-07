import { api } from '../utils/apiClient';

export async function getSites() {
  const { data } = await api.get('/sites');
  if (!data?.success) throw new Error(data?.message || 'Erreur chargement sites');
  return data.data;
}

export async function getLocaux(params = {}) {
  const { data } = await api.get('/locaux', { params });
  if (!data?.success) throw new Error(data?.message || 'Erreur chargement locaux');
  return data.data;
}

export async function getSiteLocaux(siteId) {
  const { data } = await api.get(`/sites/${siteId}/locaux`);
  if (!data?.success) throw new Error(data?.message || 'Erreur chargement locaux du site');
  return data.data;
}

