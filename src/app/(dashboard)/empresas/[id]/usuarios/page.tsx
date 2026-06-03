'use client';

import { use } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { ChevronRight, Plus, Pencil, ShieldCheck, CheckCircle2, AlertCircle, XCircle, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

  // BIC entities still loading
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
      <span
        title={`Configurada el ${date}`}
        className="inline-flex items-center gap-1 text-xs font-medium text-green-600"
      >
        <KeyRound className="size-3" />
        {date}
      </span>
    );
  }
  return (
    <span
      title="Contraseña por defecto (nunca fue cambiada)"
      className="inline-flex items-center gap-1 text-xs font-medium text-amber-600"
    >
      <XCircle className="size-3" />
      Por defecto
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UsuariosEmpresaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: company }  = useSWR<Company>(`/portal/companies/${id}`, swrFetcher);
  const { data: accesos, isLoading } = useSWR<UcaItem[]>(`/portal/access?companyId=${id}`, swrFetcher);

  // Traemos todos los empleados BIC de la empresa para validar los códigos
  const { data: bicEmployees } = useSWR<BicEmployee[]>(
    `/portal/companies/${id}/bic-entities`,
    swrFetcher,
    { revalidateOnFocus: false },
  );

  // Set de códigos BIC válidos — null mientras carga
  const validBicCodes: Set<string> | null = bicEmployees
    ? new Set(bicEmployees.map(e => e.CODIGO_BIC?.trim()).filter(Boolean))
    : null;

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div>
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          <Link href="/empresas" className="hover:text-foreground">Empresas</Link>
          <ChevronRight className="size-3" />
          <Link href={`/empresas/${id}`} className="hover:text-foreground">{company?.name ?? `#${id}`}</Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground">Usuarios</span>
        </nav>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Usuarios de {company?.name}</h1>
          <Button nativeButton={false} render={<Link href={`/empresas/${id}/usuarios/nuevo`} />}>
            <Plus className="size-4" />
            Nuevo acceso
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Cargando…</div>
      ) : (
        <div className="rounded-xl border overflow-hidden shadow-sm">
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

                  {/* Usuario */}
                  <TableCell>
                    <p className="font-medium text-sm">{uca.userName}</p>
                    <p className="text-xs text-muted-foreground">{uca.userEmail}</p>
                  </TableCell>

                  {/* Roles */}
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

                  {/* Permisos directos */}
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

                  {/* BIC code + validación */}
                  <TableCell>
                    <BicBadge externalId={uca.externalId} validCodes={validBicCodes} />
                  </TableCell>

                  {/* Contraseña */}
                  <TableCell>
                    <PasswordBadge passwordChangedAt={uca.passwordChangedAt} />
                  </TableCell>

                  {/* Estado */}
                  <TableCell>
                    <Badge variant={uca.isActive ? 'default' : 'secondary'}>
                      {uca.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>

                  {/* Acciones */}
                  <TableCell>
                    <div className="flex items-center justify-end">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Editar acceso"
                        nativeButton={false}
                        render={<Link href={`/empresas/${id}/usuarios/${uca.id}`} />}
                      >
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

      {/* BIC legend */}
      {validBicCodes !== null && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
