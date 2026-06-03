'use client';

import { use } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { UsuarioForm, PortalUserData } from '@/components/usuarios/UsuarioForm';
import { swrFetcher } from '@/lib/api';

export default function EditarUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: user, isLoading } = useSWR<PortalUserData>(`/portal/users/${id}`, swrFetcher);

  if (isLoading) return <div className="text-sm text-muted-foreground">Cargando…</div>;
  if (!user) return <div className="text-sm text-destructive">Usuario no encontrado.</div>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          <Link href="/usuarios" className="hover:text-foreground">Usuarios</Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground">{user.name}</span>
        </nav>
        <h1 className="text-2xl font-semibold">Editar usuario</h1>
      </div>
      <UsuarioForm mode="edit" initial={user} />
    </div>
  );
}
