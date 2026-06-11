import { getToken, clearToken } from './auth';

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

export async function adminFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = getToken();
  const url = `${API_URL}/${path.replace(/^\//, '')}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
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

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

/** Helper para el fetcher de SWR */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const swrFetcher = (path: string): Promise<any> => adminFetch(path);
