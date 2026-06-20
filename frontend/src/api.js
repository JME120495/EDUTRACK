const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('edutrack_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, config);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const error = new Error(err.message || `API Error ${res.status}`);
    error.status = res.status;
    error.data = err;
    throw error;
  }

  // Handle 204 No Content
  if (res.status === 204) return null;

  return res.json();
}
