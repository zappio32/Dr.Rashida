import { apiFetch } from './client';

export function listAllAppointments() {
  return apiFetch<{ appointments: unknown[] }>('/api/admin/appointments');
}

export function listServices() {
  return apiFetch<{ services: unknown[] }>('/api/admin/services');
}

export function createService(input: { name: string; description: string; durationMin: number; fee: number; active?: boolean }) {
  return apiFetch<{ service: unknown }>('/api/admin/services', { method: 'POST', body: JSON.stringify(input) });
}
