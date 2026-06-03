'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Plus, RotateCw, Users, Pencil, Wifi, WifiOff, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { swrFetcher, adminFetch } from '@/lib/api';

interface Company {
  id: number;
  name: string;
  slug: string;
  dbHost: string;
  dbDatabase: string;
  isActive: boolean;
  lastPingAt: string | null;
  lastPingOk: boolean | null;
  lastPingMs: number | null;
}

// ── Cuánto hace — e.g. "hace 3 min", "hace 2 h" ─────────────────────────────

function timeAgo(isoDate: string): string {
  const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (diff < 60)   return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} d`;
}

// ── Badge estático — lee datos de DB, sin requests extra ─────────────────────

function PingStatus({ company, refreshing }: { company: Company; refreshing: boolean }) {
  if (refreshing) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <RotateCw className="size-3 animate-spin" />
        Verificando…
      </span>
    );
  }

  if (company.lastPingAt === null) {
    return <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/50"><Minus className="size-3" />Sin datos</span>;
  }

  const ago = timeAgo(company.lastPingAt);

  if (company.lastPingOk) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium">
        <Wifi className="size-3 text-green-500" />
        <span className="text-green-600">{company.lastPingMs}ms</span>
        <span className="text-muted-foreground/50">· {ago}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <WifiOff className="size-3 text-red-500" />
      <span className="text-red-500">Sin conexión</span>
      <span className="text-muted-foreground/50">· {ago}</span>
    </span>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function EmpresasPage() {
  const { data: companies, isLoading, mutate } = useSWR<Company[]>('/portal/companies', swrFetcher);
  const [refreshing, setRefreshing] = useState<Record<number, boolean>>({});

  async function forceRefresh(id: number) {
    setRefreshing(prev => ({ ...prev, [id]: true }));
    try {
      await adminFetch(`/portal/companies/${id}/test-connection`, { method: 'POST' });
      await mutate(); // revalida la lista para traer lastPingAt/Ok/Ms actualizados
    } finally {
      setRefreshing(prev => ({ ...prev, [id]: false }));
    }
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Gestiona las empresas del sistema</p>
        <Button nativeButton={false} render={<Link href="/empresas/nueva" />}>
          <Plus className="size-4" />
          Nueva empresa
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Cargando…</div>
      ) : (
        <div className="rounded-xl border overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Host · Base de datos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>
                  Última conexión
                  <span className="ml-1 text-[10px] font-normal text-muted-foreground/60">(auto · 5 min)</span>
                </TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                    No hay empresas registradas.
                  </TableCell>
                </TableRow>
              )}

              {companies?.map(company => (
                <TableRow key={company.id}>

                  {/* Nombre + slug */}
                  <TableCell>
                    <p className="font-medium text-sm">{company.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{company.slug}</p>
                  </TableCell>

                  {/* Host + DB */}
                  <TableCell>
                    <p className="text-sm">{company.dbHost}</p>
                    <p className="text-xs text-muted-foreground font-mono">{company.dbDatabase}</p>
                  </TableCell>

                  {/* Activo / Inactivo */}
                  <TableCell>
                    <Badge variant={company.isActive ? 'default' : 'secondary'}>
                      {company.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>

                  {/* Estado de conexión desde DB + botón refresh manual */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <PingStatus company={company} refreshing={refreshing[company.id] ?? false} />
                      <button
                        onClick={() => forceRefresh(company.id)}
                        disabled={refreshing[company.id]}
                        title="Verificar ahora"
                        className="text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-30 transition-colors"
                      >
                        <RotateCw className="size-3" />
                      </button>
                    </div>
                  </TableCell>

                  {/* Acciones */}
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" title="Gestionar usuarios"
                        nativeButton={false} render={<Link href={`/empresas/${company.id}/usuarios`} />}>
                        <Users className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" title="Editar"
                        nativeButton={false} render={<Link href={`/empresas/${company.id}`} />}>
                        <Pencil className="size-4" />
                      </Button>
                    </div>
                  </TableCell>

                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
