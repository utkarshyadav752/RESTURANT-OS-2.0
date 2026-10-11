/**
 * Typed API Client for RestaurantOS
 * Features automatic dual-mode fallback:
 * 1. Connects to backend Express API if running (Dev, Docker, Cloud Run, Vercel Serverless)
 * 2. Gracefully falls back to clientStore if deployed to static hosts (Vercel static, Netlify)
 *    or if backend is unreachable, ensuring 100% login uptime and functionality.
 */

import { clientStore } from './clientStore.ts';

const BASE_URL = '/api/v1';
const STANDALONE_STORAGE_KEY = 'restaurantos_standalone_mode';

let isStandalone = false;
try {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    isStandalone = sessionStorage.getItem(STANDALONE_STORAGE_KEY) === 'true';
  }
} catch (_) {}

export function isStandaloneMode(): boolean {
  return isStandalone;
}

export function setStandaloneMode(val: boolean): void {
  isStandalone = val;
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem(STANDALONE_STORAGE_KEY, val ? 'true' : 'false');
    }
  } catch (_) {}
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function handleClientStoreFallback<T = any>(endpoint: string, options: RequestInit = {}): T {
  const method = (options.method || 'GET').toUpperCase();
  let body: any = undefined;
  if (options.body && typeof options.body === 'string') {
    try {
      body = JSON.parse(options.body);
    } catch (_) {
      body = options.body;
    }
  } else if (options.body) {
    body = options.body;
  }

  let token: string | null = null;
  if (options.headers) {
    const headers = new Headers(options.headers);
    token = headers.get('Authorization');
  }
  if (!token && typeof localStorage !== 'undefined') {
    token = localStorage.getItem('restaurantos_token');
  }

  const result = clientStore.handleRequest(method, endpoint, body, token);
  if (result.status >= 400) {
    const errorMsg = result.data?.error || result.data?.message || `Request failed with status ${result.status}`;
    throw new ApiError(errorMsg, result.status, result.data);
  }

  return result.data as T;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // If we already know this host does not have an active Node backend,
  // execute immediately via clientStore for zero-latency instant response.
  if (isStandalone) {
    return handleClientStoreFallback<T>(endpoint, options);
  }

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('restaurantos_token') : null;
  const headers = new Headers(options.headers || {});

  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('/api') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';

    // If Vercel or static hosting returned 404 / 405 / 502 / 504 OR
    // if Vercel SPA rewrote /api requests to index.html (text/html):
    const isHtmlResponse = contentType.includes('text/html') || (!contentType.includes('application/json') && !contentType.includes('text/plain'));
    const isServerUnavailable = response.status === 404 || response.status === 405 || response.status === 502 || response.status === 503 || response.status === 504;

    if (isServerUnavailable || (isHtmlResponse && !endpoint.includes('.html'))) {
      console.info(`[RestaurantOS] Host environment has no live backend (${response.status} ${contentType}). Switching to local offline/Vercel resilience mode.`);
      setStandaloneMode(true);
      return handleClientStoreFallback<T>(endpoint, options);
    }

    let data: any = null;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
      throw new ApiError(errorMsg, response.status, data);
    }

    return data as T;
  } catch (err: any) {
    // If it's a genuine validation error from the backend (like 401 wrong password or 400 bad input), propagate it
    if (err instanceof ApiError && (err.status === 400 || err.status === 401 || err.status === 403 || err.status === 422)) {
      throw err;
    }

    // Network error (Failed to fetch, CORS blocked, DNS unreachable on static hosting)
    console.info('[RestaurantOS] Network request failed. Activating local Vercel resilience engine.');
    setStandaloneMode(true);
    return handleClientStoreFallback<T>(endpoint, options);
  }
}

export const api = {
  get: <T = any>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  post: <T = any>(endpoint: string, body?: any) => 
    apiRequest<T>(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T = any>(endpoint: string, body?: any) => 
    apiRequest<T>(endpoint, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T = any>(endpoint: string, body?: any) => 
    apiRequest<T>(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T = any>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
};
