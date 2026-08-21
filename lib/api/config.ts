// Single source of truth for the backend API base URL. Both the browser client
// (client.ts) and server-side helper (server.ts) import this — never hardcode
// the backend URL anywhere else.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
