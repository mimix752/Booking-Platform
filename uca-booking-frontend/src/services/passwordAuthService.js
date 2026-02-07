import { api, setAuthToken } from '../utils/apiClient';

export async function registerApi(payload) {
  const { data } = await api.post('/auth/register', payload);
  if (!data?.success) throw new Error(data?.message || 'Inscription échouée');

  const token = data?.data?.token;
  const user = data?.data?.user;
  if (token) setAuthToken(token);

  return { token, user };
}

export async function loginApi(payload) {
  const { data } = await api.post('/auth/login', payload);
  if (!data?.success) throw new Error(data?.message || 'Connexion échouée');

  const token = data?.data?.token;
  const user = data?.data?.user;
  if (token) setAuthToken(token);

  return { token, user };
}

