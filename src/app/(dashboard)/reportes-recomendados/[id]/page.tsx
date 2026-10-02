'use client';

import { use } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { ReporteRecomendadoForm, ReporteRecomendadoData } from '@/components/reportes-recomendados/ReporteRecomendadoForm';
import { swrFetcher } from '@/lib/api';

export default function EditarReporteRecomendadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: reporte, isLoading } = useSWR<ReporteRecomendadoData>(`/portal/reportes-recomendados/${id}`, swrFetcher);

  if (isLoading) return <div className="text-sm text-muted-foreground">Cargando…</div>;
  if (!reporte) return <div className="text-sm text-destructive">Reporte recomendado no encontrado.</div>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          <Link href="/reportes-recomendados" className="hover:text-foreground">Reportes Recomendados</Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground">{reporte.nombre}</span>
        </nav>
        <h1 className="text-2xl font-semibold">Editar reporte recomendado</h1>
      </div>
      <ReporteRecomendadoForm mode="edit" initial={{ ...reporte, id: Number(id) }} />
    </div>
  );
}
