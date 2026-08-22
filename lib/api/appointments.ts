import { apiFetch } from './client';

export interface AppointmentInput {
  serviceId: string;
  consultationType: 'ONLINE' | 'CLINIC';
  localDate: string;
  localTime: string;
  doctorId?: string;
  concern?: string;
  notes?: string;
}

export interface PublicDepartment {
  id: string;
  name: string;
  description: string;
}

export interface PublicDoctor {
  id: string;
  name: string;
  qualification: string;
  departmentId: string;
  durationMin: number;
}

export function listAppointments() {
  return apiFetch<{ appointments: unknown[] }>('/api/appointments');
}

export function listPublicDepartments() {
  return apiFetch<{ departments: PublicDepartment[] }>('/api/public/departments');
}

export function listPublicDoctors(departmentId: string) {
  return apiFetch<{ doctors: PublicDoctor[] }>(`/api/public/doctors?departmentId=${encodeURIComponent(departmentId)}`);
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

export function getAvailability(date: string, params: { serviceId?: string; doctorId?: string; consultationType?: string }) {
  const query = new URLSearchParams({ date });
  if (params.doctorId) query.set('doctorId', params.doctorId);
  if (params.serviceId) query.set('serviceId', params.serviceId);
  if (params.consultationType) query.set('type', params.consultationType);
  return apiFetch<{ slots: string[]; timezone: string }>(`/api/availability?${query.toString()}`);
}
