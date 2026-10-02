'use client';

import { use } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { ChevronRight, Paintbrush } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlantillaFacturaRecomendadaForm, PlantillaFacturaRecomendadaData } from '@/components/plantillas-factura-recomendadas/PlantillaFacturaRecomendadaForm';
import { swrFetcher } from '@/lib/api';

export default function EditarPlantillaFacturaRecomendadaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: plantilla, isLoading } = useSWR<PlantillaFacturaRecomendadaData>(`/portal/plantillas-factura-recomendadas/${id}`, swrFetcher);

  if (isLoading) return <div className="text-sm text-muted-foreground">Cargando…</div>;
  if (!plantilla) return <div className="text-sm text-destructive">Plantilla recomendada no encontrada.</div>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          <Link href="/plantillas-factura-recomendadas" className="hover:text-foreground">Plantillas de Factura Recomendadas</Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground">{plantilla.nombre}</span>
        </nav>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Editar plantilla de factura recomendada</h1>
          <Button variant="outline" nativeButton={false} render={<Link href={`/plantillas-factura-recomendadas/${id}/disenar`} />}>
            <Paintbrush className="size-4" />
            Abrir el diseñador
          </Button>
        </div>
      </div>
      <PlantillaFacturaRecomendadaForm mode="edit" initial={{ ...plantilla, id: Number(id) }} />
    </div>
  );
}
