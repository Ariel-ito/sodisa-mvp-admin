import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { EmpresaForm } from '@/components/empresas/EmpresaForm';

export default function NuevaEmpresaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          <Link href="/empresas" className="hover:text-foreground">Empresas</Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground">Nueva</span>
        </nav>
        <h1 className="text-2xl font-semibold">Nueva empresa</h1>
      </div>
      <EmpresaForm mode="create" />
    </div>
  );
}
