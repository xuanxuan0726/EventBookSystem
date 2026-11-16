// Thin wrapper around fetch. Every backend response looks like
// { success, message, data?, errors? }. Failures are thrown as ApiError.

const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'eventbook_admin_token';

export class ApiError extends Error {
  constructor(message, status, errors = {}) {
    super(message);
    this.status = status;
    this.errors = errors; // field => message
  }
}

export const tokenStore = {
  get: () => safe(() => localStorage.getItem(TOKEN_KEY)),
  set: (t) => safe(() => localStorage.setItem(TOKEN_KEY, t)),
  clear: () => safe(() => localStorage.removeItem(TOKEN_KEY)),
};

function safe(fn) {
  try {
    return fn();
  } catch {
    return null;
  }
}

async function request(path, { method = 'GET', body, auth = false, signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && tokenStore.get()) headers.Authorization = `Bearer ${tokenStore.get()}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      signal,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Network error. Please check your connection.', 0);
  }

  const json = await res.json().catch(() => null);
  if (!json) {
    throw new ApiError(
      `Cannot reach the API (HTTP ${res.status}). Is the PHP server running on port 8000?`,
      res.status
    );
  }
  if (!res.ok || !json.success) {
    throw new ApiError(json.message || 'Something went wrong.', res.status, json.errors);
  }
  return json; // { success, message, data }
}

const qs = (params) => {
  const entries = Object.entries(params).filter(([, v]) => v);
  return entries.length ? `?${new URLSearchParams(entries)}` : '';
};

export const eventsApi = {
  list: (filters = {}, signal) => request(`/events${qs(filters)}`, { signal }),
  register: (eventId, payload) => request(`/events/${eventId}/register`, { method: 'POST', body: payload }),
  create: (payload) => request('/events', { method: 'POST', body: payload, auth: true }),
  remove: (id) => request(`/events/${id}`, { method: 'DELETE', auth: true }),
};

export const registrationsApi = {
  byEmail: (email) => request(`/registrations${qs({ email })}`),
  cancel: (id, email) => request(`/registrations/${id}`, { method: 'DELETE', body: { email } }),
  all: () => request('/admin/registrations', { auth: true }),
  adminCancel: (id) => request(`/admin/registrations/${id}`, { method: 'DELETE', auth: true }),
};

export const authApi = {
  login: (username, password) => request('/admin/login', { method: 'POST', body: { username, password } }),
  me: () => request('/admin/me', { auth: true }),
  logout: () => request('/admin/logout', { method: 'POST', auth: true }),
};
