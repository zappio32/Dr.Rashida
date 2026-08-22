// Turns a FastAPI-style error body (string `detail`, or Pydantic validation array) into a readable message.
export function extractErrorMessage(body: unknown, fallback = 'Request failed.'): string {
  if (!body || typeof body !== 'object') return fallback;
  const detail = (body as { detail?: unknown; error?: unknown }).detail ?? (body as { detail?: unknown; error?: unknown }).error;
  if (!detail) return fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const parts = detail.map(item => {
      if (item && typeof item === 'object') {
        const entry = item as { loc?: unknown[]; msg?: string; message?: string };
        const loc = Array.isArray(entry.loc) ? entry.loc.filter(part => part !== 'body' && part !== 'query' && part !== '__root__') : [];
        const field = loc.length ? formatFieldName(String(loc[loc.length - 1])) : '';
        const msg = entry.msg || entry.message || 'Invalid value.';
        return field ? `${field}: ${msg}` : msg;
      }
      return String(item);
    });
    return parts.join(' ') || fallback;
  }
  if (typeof detail === 'object') {
    const entry = detail as { msg?: string; message?: string };
    return entry.msg || entry.message || fallback;
  }
  return fallback;
}

function formatFieldName(field: string): string {
  const spaced = field.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).trim();
}
