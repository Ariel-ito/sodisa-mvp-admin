'use client';

import { usePathname } from 'next/navigation';
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
        <span>Verificando…</span>
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
      {ok ? `API OK${latency ? ` · ${latency}ms` : ''}` : 'API Error'}
    </div>
  );
}

// ── TopBar ────────────────────────────────────────────────────────────────────

export function TopBar() {
  const title = usePageTitle();

  return (
    <header className="flex h-14 items-center border-b bg-background px-6 gap-4 shrink-0">
      {/* Page title */}
      <h1 className="flex-1 text-sm font-semibold text-foreground">{title}</h1>

      {/* API health */}
      <HealthBadge />
    </header>
  );
}
