import { apiFetch } from './client';

export function listAllAppointments() {
  return apiFetch<{ appointments: unknown[] }>('/api/admin/appointments');
}

export interface AdminService {
  id: string;
  name: string;
  description: string;
  durationMin: number;
  fee: number;
  active: boolean;
}

export type ServiceInput = { name: string; description: string; durationMin: number; fee: number; active?: boolean };

export function listServices() {
  return apiFetch<{ services: AdminService[] }>('/api/admin/services');
}

export function getService(id: string) {
  return apiFetch<{ service: AdminService }>(`/api/admin/services/${id}`);
}

export function createService(input: ServiceInput) {
  return apiFetch<{ service: AdminService }>('/api/admin/services', { method: 'POST', body: JSON.stringify(input) });
}

export function updateService(id: string, input: Partial<ServiceInput>) {
  return apiFetch<{ service: AdminService }>(`/api/admin/services/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function deleteService(id: string) {
  return apiFetch<{ ok: boolean }>(`/api/admin/services/${id}`, { method: 'DELETE' });
}
