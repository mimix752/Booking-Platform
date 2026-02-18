import { api } from '../utils/apiClient';

export async function getAdminLocaux(params = {}) {
  // Pas d’endpoint admin spécifique pour lister les locaux: on réutilise /locaux
  const { data } = await api.get('/locaux', { params });
  if (!data?.success) {
    throw new Error(data?.message || 'Erreur lors du chargement des locaux');
  }
  return data;
}

export async function getAllLocauxAdmin() {
  const { data } = await api.get('/admin/locaux');
  if (!data?.success) {
    throw new Error(data?.message || 'Erreur lors du chargement des locaux');
  }
  return data;
}

export async function toggleLocalActive(localId) {
  const { data } = await api.post(`/admin/locaux/${localId}/toggle-active`);
  if (!data?.success) {
    throw new Error(data?.message || 'Erreur lors du changement de statut');
  }
  return data;
}

export async function updateLocalStatut(localId, statut) {
  const { data } = await api.put(`/admin/locaux/${localId}`, { statut });
  if (!data?.success) {
    throw new Error(data?.message || 'Erreur lors du changement de statut');
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

// Ajout d'un local via endpoint public POST /admin/locaux
export async function addLocalPublic(localData) {
  // localData: { nom, type, capacite, equipements, description }
  console.log('Payload sent to backend:', localData); // Debug
  try {
    const { data } = await api.post('/admin/locaux', localData);
    if (!data?.success) {
      console.error('Backend error response:', data); // Debug
      if (data?.errors) {
        console.error('Validation errors:', data.errors); // Log validation errors
      }
      throw new Error(data?.message + ': ' + JSON.stringify(data?.errors));
    }
    return data;
  } catch (err) {
    if (err.response) {
      console.error('Backend error response:', err.response.data); // Debug
      if (err.response.data?.errors) {
        console.error('Validation errors:', err.response.data.errors); // Log validation errors
      }
      throw new Error((err.response.data?.message || 'Erreur') + ': ' + JSON.stringify(err.response.data?.errors));
    }
    throw err;
  }
}
