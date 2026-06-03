import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { UsuarioForm } from '@/components/usuarios/UsuarioForm';

export default function NuevoUsuarioPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          <Link href="/usuarios" className="hover:text-foreground">Usuarios</Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground">Nuevo</span>
        </nav>
        <h1 className="text-2xl font-semibold">Nuevo usuario del portal</h1>
      </div>
      <UsuarioForm mode="create" />
    </div>
  );
}
