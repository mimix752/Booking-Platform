import axios from 'axios';

// Configure la baseURL pour les appels API. Vous pouvez ajuster la valeur
// via la variable d'environnement MIX_APP_URL ou laisser localhost:8000 par défaut.
const baseURL = process.env.MIX_APP_URL || process.env.VUE_APP_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: baseURL + '/api',
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// Log simple request/response info to help debugging during development
api.interceptors.request.use((config) => {
  // eslint-disable-next-line no-console
  console.debug('[api] Request:', config.method?.toUpperCase(), config.url, config.params || config.data || '');
  return config;
}, (error) => {
  // eslint-disable-next-line no-console
  console.error('[api] Request error:', error);
  return Promise.reject(error);
});

api.interceptors.response.use((response) => {
  // eslint-disable-next-line no-console
  console.debug('[api] Response:', response.status, response.config.url);
  return response;
}, (error) => {
  // eslint-disable-next-line no-console
  if (error.response) {
    console.error('[api] Response error:', error.response.status, error.response.config?.url, error.response.data || error.message);
  } else {
    console.error('[api] Network error:', error.message);
  }
  return Promise.reject(error);
});

export default api;

