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

export interface Department {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

export type DepartmentInput = { name: string; description: string; active?: boolean };

export function listDepartments() {
  return apiFetch<{ departments: Department[] }>('/api/admin/departments');
}

export function createDepartment(input: DepartmentInput) {
  return apiFetch<{ department: Department }>('/api/admin/departments', { method: 'POST', body: JSON.stringify(input) });
}

export function updateDepartment(id: string, input: Partial<DepartmentInput>) {
  return apiFetch<{ department: Department }>(`/api/admin/departments/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function deleteDepartment(id: string) {
  return apiFetch<{ ok: boolean }>(`/api/admin/departments/${id}`, { method: 'DELETE' });
}

export interface Doctor {
  id: string;
  name: string;
  qualification: string;
  departmentId: string;
  durationMin: number;
  active: boolean;
}

export type DoctorInput = { name: string; qualification: string; departmentId: string; durationMin: number; active?: boolean };

export function listDoctors(departmentId?: string) {
  const query = departmentId ? `?departmentId=${encodeURIComponent(departmentId)}` : '';
  return apiFetch<{ doctors: Doctor[] }>(`/api/admin/doctors${query}`);
}

export function getDoctor(id: string) {
  return apiFetch<{ doctor: Doctor }>(`/api/admin/doctors/${id}`);
}

export function createDoctor(input: DoctorInput) {
  return apiFetch<{ doctor: Doctor }>('/api/admin/doctors', { method: 'POST', body: JSON.stringify(input) });
}

export function updateDoctor(id: string, input: Partial<DoctorInput>) {
  return apiFetch<{ doctor: Doctor }>(`/api/admin/doctors/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function deleteDoctor(id: string) {
  return apiFetch<{ ok: boolean }>(`/api/admin/doctors/${id}`, { method: 'DELETE' });
}

export const WEEK_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
export type WeekDay = (typeof WEEK_DAYS)[number];

export interface DoctorBreak {
  id?: string;
  startTime: string;
  endTime: string;
}

export interface DoctorDaySchedule {
  day: WeekDay;
  off: boolean;
  startTime: string;
  endTime: string;
  slotDurationMin: number;
  breaks: DoctorBreak[];
}

export function getDoctorSchedule(doctorId: string) {
  return apiFetch<{ days: DoctorDaySchedule[] }>(`/api/admin/doctors/${doctorId}/schedule`);
}

export function updateDoctorSchedule(doctorId: string, days: DoctorDaySchedule[]) {
  return apiFetch<{ days: DoctorDaySchedule[] }>(`/api/admin/doctors/${doctorId}/schedule`, { method: 'PUT', body: JSON.stringify({ days }) });
}

export interface DoctorLeave {
  id: string;
  date: string;
  reason?: string;
}

export function listDoctorLeaves(doctorId: string) {
  return apiFetch<{ leaves: DoctorLeave[] }>(`/api/admin/doctors/${doctorId}/leaves`);
}

export function addDoctorLeave(doctorId: string, date: string, reason?: string) {
  return apiFetch<{ leave: DoctorLeave }>(`/api/admin/doctors/${doctorId}/leaves`, { method: 'POST', body: JSON.stringify({ date, reason }) });
}

export function removeDoctorLeave(doctorId: string, leaveId: string) {
  return apiFetch<{ ok: boolean }>(`/api/admin/doctors/${doctorId}/leaves/${leaveId}`, { method: 'DELETE' });
}
