import { api, setAuthToken, clearAuthToken } from '../utils/apiClient';

/**
 * POST /auth/google-login
 * body: { token: <google_id_token> }
 */
export async function googleLogin(googleIdToken) {
  const { data } = await api.post('/auth/google-login', { token: googleIdToken });
  if (!data?.success) {
    throw new Error(data?.message || 'Connexion échouée');
  }

  const token = data?.data?.token;
  const user = data?.data?.user;

  if (token) setAuthToken(token);

  return { token, user };
}

export async function verifyToken() {
  const { data } = await api.get('/auth/verify-token');
  if (!data?.success) {
    throw new Error(data?.message || 'Token invalide');
  }
  return data.data;
}

export async function logoutApi() {
  try {
    await api.post('/auth/logout');
  } finally {
    clearAuthToken();
  }
}

