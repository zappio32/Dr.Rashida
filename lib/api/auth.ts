import { apiFetch } from './client';

export function login(email: string, password: string) {
  return apiFetch<{ role: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function register(name: string, email: string, password: string) {
  return apiFetch<{ ok: boolean }>('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
}

export function logout() {
  return apiFetch<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
}

export function getSession() {
  return apiFetch<{ userId: string; role: string; name: string; email: string }>('/api/auth/session');
}
