function resolveBase() {
  if (typeof window !== 'undefined' && window.__CARRER_X_API__) {
    return String(window.__CARRER_X_API__).replace(/\/$/, '');
  }
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('carrerx_api') : '';
  if (stored) return stored.replace(/\/$/, '');
  const env = import.meta.env.VITE_API_URL;
  if (env) return String(env).replace(/\/$/, '');
  if (import.meta.env.DEV) return '';
  return '';
}

const BASE = resolveBase();

export function setToken(token) {
  if (token) localStorage.setItem('carrerx_token', token);
  else localStorage.removeItem('carrerx_token');
}

export function getToken() {
  return localStorage.getItem('carrerx_token');
}

export async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(BASE + path, { ...options, headers });
  const data = await r.json().catch(() => ({ success: false, message: 'Invalid server response' }));
  if (!r.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export function apiBase() {
  return BASE || window.location.origin;
}
