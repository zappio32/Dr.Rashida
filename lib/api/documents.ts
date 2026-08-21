import { apiFetch } from './client';

export function uploadDocument(input: {
  appointmentId: string;
  storageKey: string;
  originalName: string;
  mimeType: 'application/pdf' | 'image/jpeg' | 'image/png';
  sizeBytes: number;
}) {
  return apiFetch<{ document: unknown }>('/api/documents', { method: 'POST', body: JSON.stringify(input) });
}

export function listNotifications() {
  return apiFetch<{ notifications: unknown[] }>('/api/notifications');
}
