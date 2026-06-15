'use client';

import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import useSWR from 'swr';
import { swrFetcher } from '@/lib/api';

interface HealthData {
  status: 'ok' | 'degraded';
  database: { status: 'ok' | 'error'; latencyMs: number | null };
  uptime: number;
}

// ── Route → title map ─────────────────────────────────────────────────────────

function usePageTitle(): string {
  const pathname = usePathname();
  if (pathname === '/')                         return 'Dashboard';
  if (pathname === '/empresas')                 return 'Empresas';
  if (pathname === '/empresas/nueva')           return 'Nueva empresa';
  if (/^\/empresas\/\d+\/usuarios\/nuevo/.test(pathname)) return 'Nuevo acceso';
  if (/^\/empresas\/\d+\/usuarios\/\d+/.test(pathname))   return 'Editar acceso';
  if (/^\/empresas\/\d+\/usuarios/.test(pathname))        return 'Accesos de empresa';
  if (/^\/empresas\/\d+/.test(pathname))                  return 'Editar empresa';
  if (pathname === '/usuarios')                 return 'Usuarios';
  if (pathname === '/usuarios/nuevo')           return 'Nuevo usuario';
  if (/^\/usuarios\/\d+/.test(pathname))        return 'Editar usuario';
  if (pathname === '/roles')                    return 'Roles';
  if (pathname === '/roles/nuevo')              return 'Nuevo rol';
  if (/^\/roles\/\d+/.test(pathname))           return 'Editar rol';
  if (pathname === '/perfil')                    return 'Mi perfil';
  return '';
}

// ── API health pill ───────────────────────────────────────────────────────────

function HealthBadge() {
  const { data, isLoading } = useSWR<HealthData>('/health', swrFetcher, {
    refreshInterval: 30_000,
    dedupingInterval: 20_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="size-1.5 rounded-full bg-muted-foreground/40 animate-pulse" />
        <span className="hidden sm:inline">Verificando…</span>
      </div>
    );
  }

  const ok      = data?.status === 'ok';
  const latency = data?.database?.latencyMs;

  return (
    <div
      title={ok ? `DB ${latency}ms · uptime ${data?.uptime}s` : 'API con problemas'}
      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
        ok
          ? 'bg-green-50 text-green-700 ring-1 ring-green-200'
          : 'bg-red-50 text-red-600 ring-1 ring-red-200'
      }`}
    >
      <span className={`size-1.5 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
      {/* Texto completo en sm+, abreviado en mobile */}
      <span className="hidden sm:inline">
        {ok ? `API OK${latency ? ` · ${latency}ms` : ''}` : 'API Error'}
      </span>
      <span className="sm:hidden">
        {ok ? 'OK' : 'Error'}
      </span>
    </div>
  );
}

// ── TopBar ────────────────────────────────────────────────────────────────────

interface Props {
  onMenuOpen?: () => void;
}

export function TopBar({ onMenuOpen }: Props) {
  const title = usePageTitle();

  return (
    <header className="flex h-14 items-center border-b bg-background px-4 md:px-6 gap-3 shrink-0">

      {/* Hamburger: solo visible en mobile */}
      <button
        className="flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors md:hidden shrink-0"
        onClick={onMenuOpen}
        aria-label="Abrir menú"
      >
        <Menu className="size-5" />
      </button>

      {/* Page title */}
      <h1 className="flex-1 text-sm font-semibold text-foreground truncate">{title}</h1>

      {/* API health */}
      <HealthBadge />
    </header>
  );
}
