'use client';

import { use } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { ChevronRight, Plus, Pencil, ShieldCheck, CheckCircle2, AlertCircle, XCircle, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LockButton } from '@/components/ui/LockButton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { swrFetcher } from '@/lib/api';

interface UcaItem {
  id: number;
  userId: number;
  isActive: boolean;
  externalId: string | null;
  userName: string;
  userEmail: string;
  roles: string[];
  permissionCount: number;
  passwordChangedAt: string | null;
  lockedUntil?: string | null;
  failedLoginAttempts?: number;
}

interface Company {
  id: number;
  name: string;
}

interface BicEmployee {
  CODIGO_BIC: string;
}

// ── BIC status ────────────────────────────────────────────────────────────────

function BicBadge({ externalId, validCodes }: { externalId: string | null; validCodes: Set<string> | null }) {
  if (!externalId) {
    return <span className="text-xs text-muted-foreground/50">Sin código</span>;
  }

  if (validCodes === null) {
    return (
      <span className="text-xs font-mono font-medium bg-muted text-foreground px-2 py-0.5 rounded">
        {externalId}
      </span>
    );
  }

  const isValid = validCodes.has(externalId);
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-medium px-2 py-0.5 rounded ring-1 ${
      isValid
        ? 'bg-green-50 text-green-700 ring-green-200'
        : 'bg-amber-50 text-amber-700 ring-amber-200'
    }`}>
      {isValid
        ? <CheckCircle2 className="size-3 shrink-0" />
        : <AlertCircle   className="size-3 shrink-0" />
      }
      {externalId}
    </span>
  );
}

// ── Password status ───────────────────────────────────────────────────────────

function PasswordBadge({ passwordChangedAt }: { passwordChangedAt: string | null }) {
  if (passwordChangedAt) {
    const date = new Date(passwordChangedAt).toLocaleDateString('es-HN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
    return (
      <span title={`Configurada el ${date}`} className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
        <KeyRound className="size-3" />
        {date}
      </span>
    );
  }
  return (
    <span title="Contraseña por defecto (nunca fue cambiada)" className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
      <XCircle className="size-3" />
      Por defecto
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UsuariosEmpresaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: company }  = useSWR<Company>(`/portal/companies/${id}`, swrFetcher);
  const { data: accesos, isLoading, mutate } = useSWR<UcaItem[]>(`/portal/access?companyId=${id}`, swrFetcher);

  const { data: bicEmployees } = useSWR<BicEmployee[]>(
    `/portal/companies/${id}/bic-entities`,
    swrFetcher,
    { revalidateOnFocus: false },
  );

  const validBicCodes: Set<string> | null = bicEmployees
    ? new Set(bicEmployees.map(e => e.CODIGO_BIC?.trim()).filter(Boolean))
    : null;

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-col gap-2">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
          <Link href="/empresas" className="hover:text-foreground">Empresas</Link>
          <ChevronRight className="size-3 shrink-0" />
          <Link href={`/empresas/${id}`} className="hover:text-foreground truncate max-w-[140px]">
            {company?.name ?? `#${id}`}
          </Link>
          <ChevronRight className="size-3 shrink-0" />
          <span className="text-foreground">Usuarios</span>
        </nav>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl md:text-2xl font-semibold leading-tight">
            Usuarios de {company?.name}
          </h1>
          <Button nativeButton={false} render={<Link href={`/empresas/${id}/usuarios/nuevo`} />} className="shrink-0">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Nuevo acceso</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Cargando…</div>
      ) : (
        <>
          {/* ── Vista desktop: tabla ─────────────────────────────── */}
          <div className="hidden md:block rounded-xl border overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Roles activos</TableHead>
                  <TableHead>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="size-3.5" />
                      Permisos
                    </span>
                  </TableHead>
                  <TableHead>Código BIC</TableHead>
                  <TableHead>
                    <span className="flex items-center gap-1">
                      <KeyRound className="size-3.5" />
                      Contraseña
                    </span>
                  </TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accesos?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      No hay usuarios con acceso a esta empresa.
                    </TableCell>
                  </TableRow>
                )}

                {accesos?.map(uca => (
                  <TableRow key={uca.id}>
                    <TableCell>
                      <p className="font-medium text-sm">{uca.userName}</p>
                      <p className="text-xs text-muted-foreground">{uca.userEmail}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {uca.roles.length > 0
                          ? uca.roles.map(role => (
                              <Badge key={role} variant="secondary" className="text-xs">{role}</Badge>
                            ))
                          : <span className="text-xs text-muted-foreground/50">—</span>
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      {uca.permissionCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full ring-1 ring-violet-100">
                          <ShieldCheck className="size-3" />
                          {uca.permissionCount}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <BicBadge externalId={uca.externalId} validCodes={validBicCodes} />
                    </TableCell>
                    <TableCell>
                      <PasswordBadge passwordChangedAt={uca.passwordChangedAt} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={uca.isActive ? 'default' : 'secondary'}>
                        {uca.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-0.5">
                        <LockButton
                          userId={uca.userId}
                          lockedUntil={uca.lockedUntil}
                          failedLoginAttempts={uca.failedLoginAttempts}
                          onSuccess={() => mutate()}
                        />
                        <Button variant="ghost" size="icon-sm" title="Editar acceso"
                          nativeButton={false} render={<Link href={`/empresas/${id}/usuarios/${uca.id}`} />}>
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
            {accesos?.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-10">
                No hay usuarios con acceso a esta empresa.
              </p>
            )}
            {accesos?.map(uca => (
              <div key={uca.id} className="rounded-xl border bg-card shadow-sm p-4 flex flex-col gap-3">

                {/* Fila 1: nombre + estado + editar */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm leading-tight">{uca.userName}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{uca.userEmail}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant={uca.isActive ? 'default' : 'secondary'} className="text-xs">
                      {uca.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <LockButton
                      userId={uca.userId}
                      lockedUntil={uca.lockedUntil}
                      failedLoginAttempts={uca.failedLoginAttempts}
                      onSuccess={() => mutate()}
                    />
                    <Button variant="ghost" size="icon-sm" title="Editar acceso"
                      nativeButton={false} render={<Link href={`/empresas/${id}/usuarios/${uca.id}`} />}>
                      <Pencil className="size-4" />
                    </Button>
                  </div>
                </div>

                {/* Fila 2: roles */}
                {uca.roles.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {uca.roles.map(role => (
                      <Badge key={role} variant="secondary" className="text-xs">{role}</Badge>
                    ))}
                  </div>
                )}

                {/* Fila 3: permisos + BIC + contraseña */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 border-t text-xs">
                  {uca.permissionCount > 0 && (
                    <span className="inline-flex items-center gap-1 font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full ring-1 ring-violet-100">
                      <ShieldCheck className="size-3" />
                      {uca.permissionCount} permisos
                    </span>
                  )}
                  <BicBadge externalId={uca.externalId} validCodes={validBicCodes} />
                  <PasswordBadge passwordChangedAt={uca.passwordChangedAt} />
                </div>

              </div>
            ))}
          </div>
        </>
      )}

      {/* BIC legend */}
      {validBicCodes !== null && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="size-3 text-green-600" /> Código verificado en el sistema BIC
          </span>
          <span className="flex items-center gap-1">
            <AlertCircle className="size-3 text-amber-500" /> Código no encontrado en BIC (puede estar desactualizado)
          </span>
        </div>
      )}

    </div>
  );
}
