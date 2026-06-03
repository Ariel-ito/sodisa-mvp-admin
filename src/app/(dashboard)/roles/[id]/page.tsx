'use client';

import { use } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { RolPermsForm, RolData } from '@/components/roles/RolPermsForm';
import { swrFetcher } from '@/lib/api';

export default function EditarRolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: role, isLoading } = useSWR<RolData>(`/portal/roles/${id}`, swrFetcher);

  if (isLoading) return <div className="text-sm text-muted-foreground">Cargando…</div>;
  if (!role) return <div className="text-sm text-destructive">Rol no encontrado.</div>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          <Link href="/roles" className="hover:text-foreground">Roles</Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground">{role.name}</span>
        </nav>
        <h1 className="text-2xl font-semibold">Editar rol</h1>
      </div>
      <RolPermsForm mode="edit" initial={role} />
    </div>
  );
}
