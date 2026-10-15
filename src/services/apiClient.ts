/**
 * Eidos Language OS - Fail-Loud API Client
 * Automatically resolves API Base URL across Web, Tauri, and Capacitor Android.
 * Unified Token Management & 401/403 Unauthorized Interceptor
 */
import type { AuthUser } from '../types';

export const PRODUCTION_API_URL = 'https://eidos-language-production.up.railway.app';
export const LOCAL_API_URL = 'http://localhost:8000';

export const AUTH_TOKEN_KEY = 'eidos_token';
export const LEGACY_AUTH_TOKEN_KEY = 'eidos_auth_token';
export const AUTH_USER_KEY = 'eidos_auth_user';

/**
 * Reads persisted JWT authentication token from localStorage
 */
export function getStoredAuthToken(): string | null {
  try {
    return (
      localStorage.getItem(AUTH_TOKEN_KEY) ||
      localStorage.getItem(LEGACY_AUTH_TOKEN_KEY) ||
      null
    );
  } catch {
    return null;
  }
}

/**
 * Persists or clears authentication token across localStorage keys
 */
export function setStoredAuthToken(token: string | null): void {
  try {
    if (token && typeof token === 'string' && token.trim()) {
      const clean = token.trim();
      localStorage.setItem(AUTH_TOKEN_KEY, clean);
      localStorage.setItem(LEGACY_AUTH_TOKEN_KEY, clean);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(LEGACY_AUTH_TOKEN_KEY);
    }
  } catch (e) {
    console.warn('[STORAGE_TOKEN_WRITE_WARN]', e);
  }
}

/**
 * Reads cached AuthUser profile for zero-latency instant hydration
 */
export function getCachedAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

/**
 * Persists or clears cached AuthUser profile
 */
export function setCachedAuthUser(user: AuthUser | null): void {
  try {
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  } catch (e) {
    console.warn('[STORAGE_USER_WRITE_WARN]', e);
  }
}

export function clearCachedAuthUser(): void {
  setCachedAuthUser(null);
}

/**
 * Clears stored authentication tokens and cached user
 */
export function clearStoredAuthToken(): void {
  setStoredAuthToken(null);
  clearCachedAuthUser();
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
}

export type UnauthorizedHandler = (error: ApiErrorResponse) => void;
const unauthorizedListeners = new Set<UnauthorizedHandler>();

/**
 * Registers an observer for 401 Unauthorized or 403 Suspended session drops.
 * Returns an unsubscribe cleanup callback.
 */
export function setOnUnauthorizedHandler(handler: UnauthorizedHandler): () => void {
  unauthorizedListeners.add(handler);
  return () => {
    unauthorizedListeners.delete(handler);
  };
}

/**
 * Notifies all session observers and DOM listeners that the session has dropped
 */
export function notifyUnauthorized(error: ApiErrorResponse): void {
  clearStoredAuthToken();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('eidos:unauthorized', { detail: error }));
  }
  for (const listener of unauthorizedListeners) {
    try {
      listener(error);
    } catch (listenerErr) {
      console.error('[UNAUTHORIZED_LISTENER_ERR]', listenerErr);
    }
  }
}

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

export class ApiError extends Error {
  code: string;
  statusCode: number;
  details?: any;

  constructor(error: ApiErrorResponse) {
    super(error.message);
    this.name = 'ApiError';
    this.code = error.code || 'UNKNOWN_API_ERROR';
    this.statusCode = typeof error.statusCode === 'number' ? error.statusCode : 500;
    this.details = error.details;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Cache Buster for GET requests to guarantee fresh data across Web, Tauri & Android WebView
  const method = (options.method || 'GET').toUpperCase();
  let url = `${baseUrl}${cleanEndpoint}`;
  if (method === 'GET') {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}_t=${Date.now()}`;
  }

  const token = getStoredAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      credentials: 'include',
      ...options,
      headers,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errInfo: ApiErrorResponse = data?.error || {
        code: `HTTP_${res.status}`,
        message: data?.message || res.statusText || 'Server request failed.',
        statusCode: res.status,
        details: data?.details,
      };

      // 401 Session Interceptor or 403 ACCOUNT_SUSPENDED
      const isAuthLoginEndpoint = cleanEndpoint.includes('/auth/login');
      const isAuthRegisterEndpoint = cleanEndpoint.includes('/auth/register');
      const isLoginOrRegister = isAuthLoginEndpoint || isAuthRegisterEndpoint;

      if (
        (res.status === 401 && !isLoginOrRegister) ||
        (res.status === 403 && errInfo.code === 'ACCOUNT_SUSPENDED')
      ) {
        notifyUnauthorized(errInfo);
      }

      throw new ApiError(errInfo);
    }

    return data?.data !== undefined ? data.data : data;
  } catch (err: any) {
    if (err?.name === 'AbortError' || err?.code === 'ABORT_ERR') {
      throw err;
    }
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
