'use client';

import { use } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { EmpresaForm, CompanyData } from '@/components/empresas/EmpresaForm';
import { PingHistoryChart } from '@/components/empresas/PingHistoryChart';
import { swrFetcher } from '@/lib/api';

export default function EditarEmpresaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: company, isLoading } = useSWR<CompanyData>(`/portal/companies/${id}`, swrFetcher);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Cargando empresa…</div>;
  }

  if (!company) {
    return <div className="text-sm text-destructive">Empresa no encontrada.</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          <Link href="/empresas" className="hover:text-foreground">Empresas</Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground">{company.name}</span>
        </nav>
        <h1 className="text-2xl font-semibold">Editar empresa</h1>
      </div>

      <EmpresaForm mode="edit" initial={company} />

      {/* Historial de pings */}
      {company.id !== undefined && (
        <div className="rounded-xl border bg-card shadow-sm p-5">
          <PingHistoryChart companyId={company.id} />
        </div>
      )}
    </div>
  );
}
