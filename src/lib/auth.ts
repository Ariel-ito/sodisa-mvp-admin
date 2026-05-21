const TOKEN_KEY = 'admin_token';
const USER_KEY  = 'admin_user';

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  // Sincronizar en cookie para que el middleware de servidor pueda leerla
  document.cookie = `${TOKEN_KEY}=${token}; path=/; SameSite=Lax`;
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  // Borrar la cookie
  document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function saveUser(user: AdminUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
