export const API_BASE = 'https://edutrack-api-1du4.onrender.com/api';

const apiCache = new Map();
const CACHE_TTL = 30000; // 30 secondes de cache en mémoire

export function clearApiCache() {
  apiCache.clear();
}

export async function apiFetch(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const token = options.usePlatformToken 
    ? localStorage.getItem('platform_token') 
    : localStorage.getItem('edutrack_token');
  const selectedYearId = localStorage.getItem('edutrack_selected_year_id');

  // Invalider le cache sur toute modification (POST, PUT, DELETE, etc.)
  if (method !== 'GET') {
    apiCache.clear();
  }

  const cacheKey = `${token || ''}:${selectedYearId || ''}:${endpoint}`;

  // Vérifier le cache si c'est un GET et pas de bypass explicite
  if (method === 'GET' && !options.bypassCache) {
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      // Retourner une copie pour éviter toute mutation accidentelle dans React
      return JSON.parse(JSON.stringify(cached.data));
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(selectedYearId && !options.usePlatformToken ? { 'X-Academic-Year': selectedYearId } : {}),
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
    if (res.status === 401) {
      // Dispatch event to AuthContext to handle logout automatically
      window.dispatchEvent(new Event('edutrack_unauthorized'));
    }
    const err = await res.json().catch(() => ({}));
    const error = new Error(err.message || `API Error ${res.status}`);
    error.status = res.status;
    error.data = err;
    throw error;
  }

  // Handle 204 No Content
  if (res.status === 204) return null;

  const data = await res.json();

  // Mettre en cache la réponse réussie
  if (method === 'GET') {
    apiCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  return data;
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
