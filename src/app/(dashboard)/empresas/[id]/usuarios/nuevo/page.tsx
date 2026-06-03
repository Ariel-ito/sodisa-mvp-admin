'use client';

import { use } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { AccesoForm } from '@/components/accesos/AccesoForm';

export default function NuevoAccesoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const companyId = Number(id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          <Link href="/empresas" className="hover:text-foreground">Empresas</Link>
          <ChevronRight className="size-3" />
          <Link href={`/empresas/${id}/usuarios`} className="hover:text-foreground">Usuarios</Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground">Nuevo acceso</span>
        </nav>
        <h1 className="text-2xl font-semibold">Nuevo acceso</h1>
      </div>
      <AccesoForm mode="create" companyId={companyId} />
    </div>
  );
}
