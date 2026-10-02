'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { PlantillaFacturaRecomendadaEditor } from '@/components/plantillas-factura-recomendadas/PlantillaFacturaRecomendadaEditor';

export default function DisenarPlantillaFacturaRecomendadaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/plantillas-factura-recomendadas" className="hover:text-foreground">Plantillas de Factura Recomendadas</Link>
        <ChevronRight className="size-3" />
        <span className="text-foreground">Diseñador</span>
      </nav>
      {/* El diseñador de 3 paneles necesita altura fija: el <main> del layout es un contenedor
          con scroll y padding (p-4/p-6 + pb-[100px]), no un flex-1 de altura completa. */}
      <div className="h-[calc(100vh-15rem)] min-h-[520px]">
        <PlantillaFacturaRecomendadaEditor
          plantillaId={Number(id)}
          onVolver={() => router.push('/plantillas-factura-recomendadas')}
        />
      </div>
    </div>
  );
}
