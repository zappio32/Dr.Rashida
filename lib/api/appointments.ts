import { apiFetch } from './client';

export interface AppointmentInput {
  serviceId: string;
  consultationType: 'ONLINE' | 'CLINIC';
  localDate: string;
  localTime: string;
  concern?: string;
  notes?: string;
}

export function listAppointments() {
  return apiFetch<{ appointments: unknown[] }>('/api/appointments');
}

export function createAppointment(input: AppointmentInput) {
  return apiFetch<{ bookingId: string }>('/api/appointments', { method: 'POST', body: JSON.stringify(input) });
}

export function cancelAppointment(id: string, reason?: string) {
  return apiFetch(`/api/appointments/${id}`, { method: 'PATCH', body: JSON.stringify({ action: 'CANCEL', reason }) });
}

export function rescheduleAppointment(id: string, localDate: string, localTime: string, reason?: string) {
  return apiFetch(`/api/appointments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'RESCHEDULE', localDate, localTime, reason })
  });
}

export function getAvailability(date: string, serviceId: string) {
  return apiFetch<{ slots: string[]; timezone: string }>(`/api/availability?date=${date}&serviceId=${serviceId}`);
}
