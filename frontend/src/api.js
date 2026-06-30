export const API_BASE = 'https://edutrack-api-1du4.onrender.com/api';

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('edutrack_token');
  const selectedYearId = localStorage.getItem('edutrack_selected_year_id');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(selectedYearId ? { 'X-Academic-Year': selectedYearId } : {}),
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

export async function openPdfInNewTab(url) {
  const token = localStorage.getItem('edutrack_token');
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // If the url is absolute, use it directly. Otherwise, prefix with the host if it's a static file path, 
  // or prefix with API_BASE if it's an API endpoint.
  // Note: the endpoints we are fixing are static file paths starting with /badges, /bulletins, etc.
  // So we prefix with API_BASE but strip '/api'.
  const isApi = url.startsWith('/api/');
  const fullUrl = url.startsWith('http') 
    ? url 
    : isApi 
      ? `${API_BASE}${url.substring(4)}`
      : `${API_BASE.replace(/\/api$/, '')}${url}`;

  const res = await fetch(fullUrl, { headers });
  if (!res.ok) {
    throw new Error(`Failed to load PDF: ${res.statusText}`);
  }

  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank');
  
  // Revoke the object URL after a delay to free up memory
  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 60000); // 1 minute should be enough for the browser to open it
}
