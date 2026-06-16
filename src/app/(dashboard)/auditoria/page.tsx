'use client';

import { useState, type ComponentType } from 'react';
import useSWR from 'swr';
import { Shield, LogIn, AlertTriangle, Lock } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { swrFetcher } from '@/lib/api';

interface AuditEntry {
  id: number;
  createdAt: string;
  action: string;
  operatorEmail: string | null;
  operatorName: string | null;
  targetEmail: string | null;
  targetName: string | null;
  ip: string | null;
  details: string | null;
  companyName: string | null;
}

interface AuditResponse {
  items: AuditEntry[];
  total: number;
}

const ACTION_CONFIG: Record<string, { label: string; cls: string }> = {
  'login.success':          { label: 'Login exitoso',       cls: 'bg-green-50 text-green-700 ring-green-200' },
  'login.fail':             { label: 'Login fallido',       cls: 'bg-red-50 text-red-700 ring-red-200' },
  'login.blocked':          { label: 'Login bloqueado',     cls: 'bg-red-100 text-red-800 ring-red-300' },
  'account.locked_auto':    { label: 'Bloqueado auto',      cls: 'bg-orange-50 text-orange-700 ring-orange-200' },
  'account.locked_manual':  { label: 'Bloqueado manual',    cls: 'bg-orange-50 text-orange-700 ring-orange-200' },
  'account.unlocked':       { label: 'Desbloqueado',        cls: 'bg-green-50 text-green-700 ring-green-200' },
  'password.changed':       { label: 'Contraseña cambiada', cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
  'password.reset':         { label: 'Reset contraseña',    cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
  'user.created':           { label: 'Usuario creado',      cls: 'bg-purple-50 text-purple-700 ring-purple-200' },
  'user.deleted':           { label: 'Usuario eliminado',   cls: 'bg-red-50 text-red-700 ring-red-200' },
  'access.created':         { label: 'Acceso creado',       cls: 'bg-purple-50 text-purple-700 ring-purple-200' },
};

const ACTION_OPTIONS = [
  { value: '', label: 'Todos los eventos' },
  ...Object.entries(ACTION_CONFIG).map(([value, { label }]) => ({ value, label })),
];

const PAGE_SIZE = 50;

function ActionBadge({ action }: { action: string }) {
  const cfg = ACTION_CONFIG[action] ?? { label: action, cls: 'bg-gray-50 text-gray-700 ring-gray-200' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function buildUrl(params: {
  action: string; email: string; from: string; to: string; offset: number;
}): string {
  const q = new URLSearchParams();
  if (params.action) q.set('action', params.action);
  if (params.email)  q.set('email',  params.email);
  if (params.from)   q.set('from',   new Date(params.from).toISOString());
  if (params.to)     q.set('to',     new Date(params.to + 'T23:59:59').toISOString());
  q.set('limit',  String(PAGE_SIZE));
  q.set('offset', String(params.offset));
  return `/portal/audit?${q.toString()}`;
}

function getTodayKey() {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
  return `/portal/audit?from=${encodeURIComponent(start)}&to=${encodeURIComponent(end)}&limit=200`;
}

// ── Stat card ──────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'red' | 'orange';
}

const COLOR_MAP = {
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-500',   border: 'border-blue-100' },
  green:  { bg: 'bg-green-50',  icon: 'text-green-500',  border: 'border-green-100' },
  red:    { bg: 'bg-red-50',    icon: 'text-red-500',    border: 'border-red-100' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-500', border: 'border-orange-100' },
};

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-4 flex items-center gap-3`}>
      <Icon className={`size-5 shrink-0 ${c.icon}`} />
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AuditoriaPage() {
  const [action,   setAction]   = useState('');
  const [email,    setEmail]    = useState('');
  const [fromDate, setFromDate] = useState('');  // YYYY-MM-DD
  const [toDate,   setToDate]   = useState('');  // YYYY-MM-DD
  const [offset,   setOffset]   = useState(0);

  const url = buildUrl({ action, email, from: fromDate, to: toDate, offset });
  const { data, isLoading } = useSWR<AuditResponse>(url, swrFetcher);

  const todayKey = getTodayKey();
  const { data: todayData } = useSWR<AuditResponse>(todayKey, swrFetcher);
  const todayItems   = todayData?.items ?? [];
  const totalToday   = todayData?.total ?? 0;
  const successToday = todayItems.filter(i => i.action === 'login.success').length;
  const failsToday   = todayItems.filter(i => i.action === 'login.fail').length;
  const lockedToday  = todayItems.filter(i => i.action.startsWith('account.locked')).length;

  const totalPages  = Math.ceil((data?.total ?? 0) / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  function applyFilters() { setOffset(0); }

  function clearFilters() {
    setAction(''); setEmail(''); setFromDate(''); setToDate(''); setOffset(0);
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-semibold">Auditoría</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Registro de acciones del panel administrativo (hoy)</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Eventos hoy"       value={totalToday}   icon={Shield}        color="blue"   />
        <StatCard label="Logins exitosos"   value={successToday} icon={LogIn}         color="green"  />
        <StatCard label="Logins fallidos"   value={failsToday}   icon={AlertTriangle} color="red"    />
        <StatCard label="Cuentas bloqueadas" value={lockedToday} icon={Lock}          color="orange" />
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
          <label className="text-xs font-medium text-muted-foreground">Evento</label>
          <select
            value={action}
            onChange={e => setAction(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {ACTION_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <label className="text-xs font-medium text-muted-foreground">Email (operador u objetivo)</label>
          <input
            type="text"
            placeholder="ejemplo@correo.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyFilters()}
            className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Desde</label>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Hasta</label>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={applyFilters}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Filtrar
          </button>
          <button
            onClick={clearFilters}
            className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-muted transition-colors"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Cargando…</div>
      ) : (
        <>
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Operador</TableHead>
                  <TableHead>Objetivo</TableHead>
                  <TableHead className="hidden lg:table-cell">Empresa</TableHead>
                  <TableHead className="hidden xl:table-cell">IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.items.length ?? 0) === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No hay registros para los filtros seleccionados.
                    </TableCell>
                  </TableRow>
                )}
                {data?.items.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleString('es-HN', {
                        day: '2-digit', month: '2-digit', year: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>
                      <ActionBadge action={entry.action} />
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="font-medium">{entry.operatorName ?? entry.operatorEmail ?? '—'}</span>
                      {entry.operatorName && entry.operatorEmail && (
                        <span className="block text-xs text-muted-foreground">{entry.operatorEmail}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span>{entry.targetName ?? entry.targetEmail ?? '—'}</span>
                      {entry.targetName && entry.targetEmail && (
                        <span className="block text-xs text-muted-foreground">{entry.targetEmail}</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {entry.companyName ?? '—'}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-xs font-mono text-muted-foreground">
                      {entry.ip ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Página {currentPage} de {totalPages} · {data?.total} registros</span>
              <div className="flex gap-2">
                <button
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                  className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-40 hover:bg-muted transition-colors"
                >
                  Anterior
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                  className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-40 hover:bg-muted transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
