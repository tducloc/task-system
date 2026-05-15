import { config } from '@/configurations';
import {
  type AuthTokens,
  clearTokens,
  getAccess,
  getRefresh,
  setTokens,
} from './auth-storage';

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

let refreshPromise: Promise<AuthTokens> | null = null;

async function doRefresh(): Promise<AuthTokens> {
  const refreshToken = getRefresh();
  if (!refreshToken) {
    throw new ApiError(401, 'No refresh token', null);
  }
  const res = await fetch(`${config.apiBaseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, 'Refresh failed', body);
  }
  const tokens = (await res.json()) as AuthTokens;
  setTokens(tokens);
  return tokens;
}

async function refreshOnce(): Promise<AuthTokens> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function handleAuthFailure(): void {
  clearTokens();
  // Hard redirect — bypasses React Router but guarantees consistent state
  // even if called from outside a React tree (e.g. background query refetch).
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

async function rawRequest<T>(
  path: string,
  options: RequestOptions,
  isRetry: boolean
): Promise<T> {
  const access = getAccess();
  const headers = new Headers(options.headers ?? {});
  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (access) {
    headers.set('Authorization', `Bearer ${access}`);
  }

  const res = await fetch(`${config.apiBaseUrl}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401 && !isRetry && getRefresh() && path !== '/auth/refresh') {
    try {
      await refreshOnce();
    } catch {
      handleAuthFailure();
      const body = await res.json().catch(() => null);
      throw new ApiError(401, 'Unauthorized', body);
    }
    return rawRequest<T>(path, options, true);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message =
      (body && typeof body === 'object' && 'message' in body && String(body.message)) ||
      res.statusText ||
      'Request failed';
    throw new ApiError(res.status, message, body);
  }

  // Some endpoints return 204 — guard against empty body.
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return rawRequest<T>(path, options, false);
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};
