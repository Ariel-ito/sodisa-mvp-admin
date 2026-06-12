import { getToken, setToken, clearToken, saveUser, AdminUser } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Single in-flight refresh promise — deduplicates concurrent calls (401 handler,
// proactive timer, focus check, React Strict Mode double-invoke).
let _inflightRefresh: Promise<{ accessToken: string; user: AdminUser } | null> | null = null;

export function hydrateToken(): Promise<{ accessToken: string; user: AdminUser } | null> {
  if (_inflightRefresh) return _inflightRefresh;
  _inflightRefresh = fetch('/api/auth/refresh', { method: 'POST' })
    .then(async (res) => {
      if (!res.ok) return null;
      const data = await res.json() as { accessToken: string; user: AdminUser };
      setToken(data.accessToken);
      if (data.user) saveUser(data.user);
      return data;
    })
    .catch(() => null)
    .finally(() => { _inflightRefresh = null; });
  return _inflightRefresh;
}

export async function adminFetch<T = unknown>(
  path: string,
  init?: RequestInit,
  _isRetry = false,
): Promise<T> {
  const token = getToken();
  const url   = `${API_URL}/${path.replace(/^\//, '')}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    if (res.status === 401 && !_isRetry) {
      const data = await hydrateToken();
      if (data) return adminFetch<T>(path, init, true);
      clearToken();
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw new ApiError(401, 'Sesión expirada');
    }

    let message = `Error ${res.status}`;
    let data: Record<string, unknown> | undefined;
    try {
      data = await res.json();
      message = (data?.message as string) ?? message;
    } catch { /* ignore */ }
    throw new ApiError(res.status, message, data);
  }

  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export const swrFetcher = (path: string): Promise<unknown> => adminFetch(path);
