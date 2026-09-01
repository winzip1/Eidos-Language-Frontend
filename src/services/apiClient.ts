/**
 * Eidos Language OS - Fail-Loud API Client
 * Automatically resolves API Base URL across Web, Tauri, and Capacitor Android.
 */

export const PRODUCTION_API_URL = 'https://eidos-language-production.up.railway.app';
export const LOCAL_API_URL = 'http://localhost:8000';

export function getApiBaseUrl(): string {
  // 1. User manual override from Settings Modal (highest priority)
  try {
    const custom = localStorage.getItem('eidos_custom_api_url');
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, '');
    }
  } catch {
    // Ignore localStorage access issues
  }

  // 2. Explicit Environment Variable injected during build/deploy
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // 3. Android APK (Capacitor) or Live Web detection
  if (typeof window !== 'undefined') {
    const isCapacitor =
      Boolean((window as any)?.Capacitor?.isNativePlatform?.()) ||
      window.location.protocol === 'capacitor:' ||
      (window.location.hostname === 'localhost' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));

    if (isCapacitor) {
      return PRODUCTION_API_URL;
    }

    // 4. Live Production Web domain detection (running on remote cloud, Railway, Vercel, or custom domain)
    const hostname = window.location.hostname;
    const isLocalhost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.endsWith('.local');

    const isTauri =
      hostname === 'tauri.localhost' ||
      window.location.protocol === 'tauri:';

    if (!isLocalhost && !isTauri) {
      return PRODUCTION_API_URL;
    }
  }

  // 5. Local development default
  return LOCAL_API_URL;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
}

export class ApiError extends Error {
  code: string;
  statusCode: number;
  details?: any;

  constructor(error: ApiErrorResponse) {
    super(error.message);
    this.name = 'ApiError';
    this.code = error.code || 'UNKNOWN_API_ERROR';
    this.statusCode = error.statusCode || 500;
    this.details = error.details;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const token = localStorage.getItem('eidos_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errInfo: ApiErrorResponse = data?.error || {
        code: `HTTP_${res.status}`,
        message: data?.message || res.statusText || 'Server request failed.',
        statusCode: res.status,
      };
      throw new ApiError(errInfo);
    }

    return data?.data !== undefined ? data.data : data;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Network / Offline failure
    throw new ApiError({
      code: 'NETWORK_ERROR',
      message: err.message || 'Cannot reach Eidos Language OS server. Check your connection.',
      statusCode: 0,
      details: err,
    });
  }
}
