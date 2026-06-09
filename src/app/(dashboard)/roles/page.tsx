'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { Plus, Pencil, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { swrFetcher } from '@/lib/api';

interface Role {
  id: number;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
}

export default function RolesPage() {
  const { data: roles, isLoading } = useSWR<Role[]>('/portal/roles', swrFetcher);

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Roles</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Roles y permisos asignables a usuarios</p>
        </div>
        <Button nativeButton={false} render={<Link href="/roles/nuevo" />} className="shrink-0">
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nuevo rol</span>
          <span className="sm:hidden">Nuevo</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Cargando…</div>
      ) : (
        <>
          {/* ── Vista desktop: tabla ─────────────────────────────── */}
          <div className="hidden md:block rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Permisos</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No hay roles registrados.
                    </TableCell>
                  </TableRow>
                )}
                {roles?.map(role => (
                  <TableRow key={role.id}>
                    <TableCell className="font-mono text-sm">{role.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {role.description}
                    </TableCell>
                    <TableCell className="text-sm">{role.permissions?.length ?? 0} permisos</TableCell>
                    <TableCell>
                      {role.isSystem
                        ? <Badge variant="secondary">Sistema</Badge>
                        : <Badge>Personalizado</Badge>
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end">
                        <Button variant="ghost" size="icon-sm" title="Editar"
                          nativeButton={false} render={<Link href={`/roles/${role.id}`} />}>
                          <Pencil className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* ── Vista mobile: cards ───────────────────────────────── */}
          <div className="md:hidden flex flex-col gap-3">
            {roles?.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                No hay roles registrados.
              </p>
            )}
            {roles?.map(role => (
              <div key={role.id} className="rounded-xl border bg-card shadow-sm p-4 flex flex-col gap-2">

                {/* Fila 1: nombre + tipo + editar */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-semibold text-sm truncate">{role.name}</span>
                    {role.isSystem
                      ? <Badge variant="secondary" className="text-xs shrink-0">Sistema</Badge>
                      : <Badge className="text-xs shrink-0">Personalizado</Badge>
                    }
                  </div>
                  <Button variant="ghost" size="icon-sm" title="Editar" className="shrink-0"
                    nativeButton={false} render={<Link href={`/roles/${role.id}`} />}>
                    <Pencil className="size-4" />
                  </Button>
                </div>

                {/* Descripción */}
                {role.description && (
                  <p className="text-xs text-muted-foreground">{role.description}</p>
                )}

                {/* Permisos count */}
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <ShieldCheck className="size-3" />
                  {role.permissions?.length ?? 0} permisos
                </span>

              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
