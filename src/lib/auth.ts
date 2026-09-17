const USER_KEY = 'admin_user';

export type AdminRole = 'admin' | 'support' | 'qa';

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: AdminRole;
  totpEnabled?: boolean;
  /** true si este usuario tiene 2FA obligatorio y no lo ha configurado -- ver TotpPolicyService (mvp_api). */
  totpSetupRequired?: boolean;
  totpGraceUntil?: string | null;
  /** true si ya venció el período de gracia -- pasa de banner descartable a modal bloqueante. */
  totpGraceExpired?: boolean;
  totpPostponeCount?: number;
}

// Access token lives only in memory — cleared on page reload, re-hydrated via /api/auth/refresh
let _accessToken: string | null = null;

export function getToken(): string | null {
  return _accessToken;
}

export function setToken(token: string): void {
  _accessToken = token;
}

export function clearToken(): void {
  _accessToken = null;
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(USER_KEY);
  }
}

// User stored in sessionStorage — survives page reloads, cleared when browser closes
export function saveUser(user: AdminUser): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function getUser(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return _accessToken !== null;
}

export function getTokenExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch { return null; }
}
