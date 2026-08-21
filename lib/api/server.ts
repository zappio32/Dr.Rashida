import { cookies } from 'next/headers';
import { API_BASE_URL } from './config';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function forwardedCookieHeader(): Promise<string> {
  const store = await cookies();
  return store.getAll().map(item => `${item.name}=${item.value}`).join('; ');
}

export async function apiServerFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  const cookieHeader = await forwardedCookieHeader();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader, ...(init?.headers || {}) }
  });
  if (response.status === 401 || response.status === 403) return null;
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await response.json() : undefined;
  if (!response.ok) throw new ApiError(body?.detail || body?.error || 'Request failed.', response.status);
  return body as T;
}

export type ServerSession = { userId: string; role: string; name: string; email: string };

export async function getServerSession(): Promise<ServerSession | null> {
  return apiServerFetch<ServerSession>('/api/auth/session');
}
