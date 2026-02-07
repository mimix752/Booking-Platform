import axios from 'axios';
import { CONFIG } from '../config/config';

const TOKEN_STORAGE_KEY = 'authToken';

export const getAuthToken = () => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setAuthToken = (token) => {
  try {
    if (!token) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      return;
    }
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // ignore
  }
};

export const clearAuthToken = () => setAuthToken(null);

export const api = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If token is invalid/expired, clear it so UI can redirect to login.
    if (error?.response?.status === 401) {
      clearAuthToken();
    }
    return Promise.reject(error);
  }
);

