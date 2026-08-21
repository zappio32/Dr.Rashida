import { apiFetch } from './client';

export function updateAppointmentStatus(appointmentId: string, status: string, reason?: string) {
  return apiFetch('/api/doctor/appointments', { method: 'PATCH', body: JSON.stringify({ appointmentId, status, reason }) });
}
