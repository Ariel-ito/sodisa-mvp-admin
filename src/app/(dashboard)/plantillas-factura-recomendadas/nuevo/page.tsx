import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { PlantillaFacturaRecomendadaForm } from '@/components/plantillas-factura-recomendadas/PlantillaFacturaRecomendadaForm';

export default function NuevaPlantillaFacturaRecomendadaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          <Link href="/plantillas-factura-recomendadas" className="hover:text-foreground">Plantillas de Factura Recomendadas</Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground">Nueva</span>
        </nav>
        <h1 className="text-2xl font-semibold">Nueva plantilla de factura recomendada</h1>
      </div>
      <PlantillaFacturaRecomendadaForm mode="create" />
    </div>
  );
}
