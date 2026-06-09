'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import {
  Building2, Users, Shield, Activity, Database,
  Clock, Plus, ChevronRight, Wifi, WifiOff,
} from 'lucide-react';
import { swrFetcher } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkline, type SparkPoint } from '@/components/empresas/Sparkline';

// ── Types ─────────────────────────────────────────────────────────────────────

interface HealthData {
  status: 'ok' | 'degraded';
  uptime: number;
  database: { status: 'ok' | 'error'; latencyMs: number | null };
  memory: { heapUsedMb: number; heapTotalMb: number };
}

interface Company {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  lastPingOk: boolean | null;
  lastPingMs: number | null;
  lastPingAt: string | null;
}

interface UcaRow { id: number }

interface PingHistoryEntry {
  companyId: number;
  logs: { ok: boolean; latencyMs: number | null }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const u = getUser();
    if (u) setUserName(u.name.split(' ')[0]);
  }, []);

  const { data: companies }   = useSWR<Company[]>('/portal/companies', swrFetcher);
  const { data: users }       = useSWR<unknown[]>('/portal/users',     swrFetcher);
  const { data: roles }       = useSWR<unknown[]>('/portal/roles',     swrFetcher);
  const { data: accesses }    = useSWR<UcaRow[]>('/portal/access',     swrFetcher);
  const { data: health }      = useSWR<HealthData>('/health',          swrFetcher, { refreshInterval: 30_000 });
  const { data: pingHistory } = useSWR<PingHistoryEntry[]>(
    '/portal/companies/ping-history-all?hours=2',
    swrFetcher,
    { refreshInterval: 5 * 60_000 },
  );

  // Map companyId → sparkline points
  const sparkMap = new Map<number, SparkPoint[]>(
    (pingHistory ?? []).map(e => [e.companyId, e.logs]),
  );

  // Fallos primero, luego OK, luego sin datos — para que el dashboard sea un health check real
  const activeCompanies = (companies ?? [])
    .filter((c) => c.isActive)
    .sort((a, b) => {
      const rank = (c: Company) =>
        c.lastPingAt === null ? 1 :   // sin datos → al final
        !c.lastPingOk        ? -1 :   // fallo → primero
        0;                            // ok → medio
      return rank(a) - rank(b);
    });

  const stats = [
    {
      label: 'Empresas activas',
      value: activeCompanies.length || '—',
      sub:   companies ? `${companies.length} totales` : '',
      icon:  Building2,
      href:  '/empresas',
      color: 'text-blue-600',
      bg:    'bg-blue-50',
      ring:  'ring-blue-100',
    },
    {
      label: 'Usuarios SODISA',
      value: users?.length ?? '—',
      sub:   'Admins y soporte',
      icon:  Users,
      href:  '/usuarios',
      color: 'text-violet-600',
      bg:    'bg-violet-50',
      ring:  'ring-violet-100',
    },
    {
      label: 'Accesos activos',
      value: accesses?.length ?? '—',
      sub:   'Usuarios de empresa',
      icon:  Activity,
      href:  '/empresas',
      color: 'text-emerald-600',
      bg:    'bg-emerald-50',
      ring:  'ring-emerald-100',
    },
    {
      label: 'Roles',
      value: roles?.length ?? '—',
      sub:   'Configurados',
      icon:  Shield,
      href:  '/roles',
      color: 'text-amber-600',
      bg:    'bg-amber-50',
      ring:  'ring-amber-100',
    },
  ];

  const dbOk  = health?.database?.status === 'ok';
  const apiOk = health?.status === 'ok';

  return (
    <div className="flex flex-col gap-8">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{greeting()},</p>
          <h1 className="text-2xl font-semibold mt-0.5">{userName || 'Administrador'} 👋</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('es-HN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Quick actions — iconos solos en mobile, texto en sm+ */}
        <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/empresas/nueva" />}>
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Empresa</span>
          </Button>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/usuarios/nuevo" />}>
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Usuario</span>
          </Button>
          <Button size="sm" nativeButton={false} render={<Link href="/roles/nuevo" />}>
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Rol</span>
          </Button>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, href, color, bg, ring }) => (
          <Link
            key={label}
            href={href}
            className={`group flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 ring-1 ${ring}`}
          >
            <div className="flex items-center justify-between">
              <div className={`flex size-10 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`size-5 ${color}`} />
              </div>
              <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
              {sub && <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>}
            </div>
          </Link>
        ))}
      </div>

      {/* ── Bottom row: Health + Companies ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* System health */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Estado del sistema
          </h2>
          <div className="rounded-xl border bg-card shadow-sm divide-y">

            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className={`size-2 rounded-full shrink-0 ${apiOk ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-medium">API</span>
              </div>
              <Badge variant={apiOk ? 'default' : 'destructive'} className="text-xs">
                {health ? (apiOk ? 'Operativo' : 'Degradado') : '—'}
              </Badge>
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Database className={`size-4 shrink-0 ${dbOk ? 'text-green-600' : 'text-red-500'}`} />
                <span className="text-sm font-medium">Base de datos</span>
              </div>
              <span className={`text-sm font-semibold ${dbOk ? 'text-green-700' : 'text-red-600'}`}>
                {health ? (dbOk ? `OK · ${health.database.latencyMs}ms` : 'Error') : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Clock className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-sm font-medium">Uptime</span>
              </div>
              <span className="text-sm font-semibold text-foreground">
                {health ? formatUptime(health.uptime) : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Activity className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-sm font-medium">Memoria</span>
              </div>
              <span className="text-sm font-semibold text-foreground">
                {health ? `${health.memory.heapUsedMb} / ${health.memory.heapTotalMb} MB` : '—'}
              </span>
            </div>

          </div>
        </div>

        {/* Companies quick list */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Conexiones de empresas
            </h2>
            <Link href="/empresas" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Ver todas →
            </Link>
          </div>
          <div className="rounded-xl border bg-card shadow-sm divide-y max-h-72 overflow-y-auto">
            {!companies ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">Cargando…</div>
            ) : activeCompanies.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">No hay empresas activas.</div>
            ) : (
              activeCompanies.map((company) => (
                <Link
                  key={company.id}
                  href={`/empresas/${company.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                >
                  {/* Avatar */}
                  <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                    {company.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Nombre + estado actual */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate leading-tight">{company.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {company.lastPingAt === null ? (
                        <span className="text-[10px] text-muted-foreground/40">sin datos</span>
                      ) : company.lastPingOk ? (
                        <span className="text-[10px] font-medium text-green-600 flex items-center gap-0.5">
                          <Wifi className="size-2.5" />{company.lastPingMs}ms
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-red-500 flex items-center gap-0.5">
                          <WifiOff className="size-2.5" />Sin conexión
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sparkline últimas 2h */}
                  <Sparkline points={sparkMap.get(company.id) ?? []} />
                </Link>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
