import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { ReporteRecomendadoForm } from '@/components/reportes-recomendados/ReporteRecomendadoForm';

export default function NuevoReporteRecomendadoPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          <Link href="/reportes-recomendados" className="hover:text-foreground">Reportes Recomendados</Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground">Nuevo</span>
        </nav>
        <h1 className="text-2xl font-semibold">Nuevo reporte recomendado</h1>
      </div>
      <ReporteRecomendadoForm mode="create" />
    </div>
  );
}
