'use client';

import { use } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { AccesoForm, UcaData } from '@/components/accesos/AccesoForm';
import { swrFetcher } from '@/lib/api';

/** Shape devuelta por GET /portal/access/:id */
interface ApiUca {
  id: number;
  companyId: number;
  userId?: number;
  externalId?: string | null;
  supervisorPin?: string | null;
  isActive: boolean;
  userName?: string;
  userEmail?: string;
  roles?: string[];
  permissions?: { code: string; grantedUntil?: string | null; reason?: string | null }[];
}

export default function EditarAccesoPage({
  params,
}: {
  params: Promise<{ id: string; ucaId: string }>;
}) {
  const { id, ucaId } = use(params);
  const companyId = Number(id);

  const { data: raw, isLoading, isValidating } = useSWR<ApiUca>(
    `/portal/access/${ucaId}`,
    swrFetcher,
    { revalidateOnMount: true, dedupingInterval: 0 },
  );

  if (isLoading || isValidating) {
    return <div className="text-sm text-muted-foreground">Cargando acceso…</div>;
  }

  if (!raw) {
    return <div className="text-sm text-destructive">Acceso no encontrado.</div>;
  }

  // Mapear la respuesta plana de la API al formato que espera AccesoForm
  const uca: UcaData = {
    id:            raw.id,
    companyId:     raw.companyId,
    userId:        raw.userId,
    externalId:    raw.externalId,
    supervisorPin: raw.supervisorPin,
    isActive:      raw.isActive,
    user:          raw.userName ? { name: raw.userName, email: raw.userEmail ?? '' } : undefined,
    activeRoles:   raw.roles ?? [],
    activePermissions: (raw.permissions ?? []).map(p => p.code),
    // grantedUntil y reason son globales al set de permisos (todos comparten el mismo valor)
    grantedUntil:  raw.permissions?.[0]?.grantedUntil ?? null,
    reason:        raw.permissions?.[0]?.reason ?? null,
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          <Link href="/empresas" className="hover:text-foreground">Empresas</Link>
          <ChevronRight className="size-3" />
          <Link href={`/empresas/${id}/usuarios`} className="hover:text-foreground">Usuarios</Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground">{raw.userName ?? `UCA #${ucaId}`}</span>
        </nav>
        <h1 className="text-2xl font-semibold">Editar acceso</h1>
      </div>
      <AccesoForm mode="edit" companyId={companyId} initial={uca} />
    </div>
  );
}
