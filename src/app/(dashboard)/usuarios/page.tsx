'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { swrFetcher } from '@/lib/api';

interface PortalUser {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

export default function UsuariosPortalPage() {
  const { data: users, isLoading } = useSWR<PortalUser[]>('/portal/users', swrFetcher);

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Usuarios del portal</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Administradores y operadores del panel</p>
        </div>
        <Button nativeButton={false} render={<Link href="/usuarios/nuevo" />} className="shrink-0">
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nuevo usuario</span>
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
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No hay usuarios registrados.
                    </TableCell>
                  </TableRow>
                )}
                {users?.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-sm">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'default' : 'secondary'}>
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end">
                        <Button variant="ghost" size="icon-sm" title="Editar"
                          nativeButton={false} render={<Link href={`/usuarios/${user.id}`} />}>
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
            {users?.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                No hay usuarios registrados.
              </p>
            )}
            {users?.map(user => (
              <div key={user.id} className="rounded-xl border bg-card shadow-sm p-4 flex items-center gap-3">
                {/* Avatar inicial */}
                <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary select-none">
                  {user.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-semibold text-sm leading-tight">{user.name}</p>
                    <Badge variant="secondary" className="capitalize text-xs">{user.role}</Badge>
                    <Badge variant={user.isActive ? 'default' : 'secondary'} className="text-xs">
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
                </div>

                {/* Editar */}
                <Button variant="ghost" size="icon-sm" title="Editar" className="shrink-0"
                  nativeButton={false} render={<Link href={`/usuarios/${user.id}`} />}>
                  <Pencil className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
