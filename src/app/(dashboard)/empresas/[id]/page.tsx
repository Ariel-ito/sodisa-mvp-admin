'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { ChevronRight, Loader2, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmpresaForm, CompanyData } from '@/components/empresas/EmpresaForm';
import { PingHistoryChart } from '@/components/empresas/PingHistoryChart';
import { CompanyConfigSection } from '@/components/empresas/CompanyConfigSection';
import { RemoteMigrationsSection } from '@/components/empresas/RemoteMigrationsSection';
import { adminFetch, ApiError, swrFetcher } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { toast } from 'sonner';

// Producción (branch "main") nunca debe poder borrar una empresa: ahí la
// política es bloquear usuarios + desactivar la empresa, no eliminarla.
// Local (sin branch), QA y Staging sí lo permiten.
const CAN_DELETE_COMPANY = process.env.NEXT_PUBLIC_BRANCH !== 'main';

export default function EditarEmpresaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: company, isLoading } = useSWR<CompanyData>(`/portal/companies/${id}`, swrFetcher);
  const [deleting, setDeleting] = useState(false);

  // Defensa en profundidad -- el middleware ya bloquea esta ruta para no-admin,
  // esto cubre el caso de que llegue por navegación cliente sin recarga.
  useEffect(() => {
    if (getUser()?.role !== 'admin') router.replace('/empresas');
  }, [router]);

  async function handleDelete() {
    if (!company) return;
    const confirmed = window.confirm(
      `¿Eliminar la empresa "${company.name}"?\n\n` +
      `Esto también eliminará TODOS los usuarios y accesos de esta empresa (roles y permisos incluidos). Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await adminFetch(`/portal/companies/${id}`, { method: 'DELETE' });
      toast.success('Empresa eliminada correctamente');
      router.push('/empresas');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al eliminar la empresa');
      setDeleting(false);
    }
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Cargando empresa…</div>;
  }

  if (!company) {
    return <div className="text-sm text-destructive">Empresa no encontrada.</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
            <Link href="/empresas" className="hover:text-foreground">Empresas</Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground">{company.name}</span>
          </nav>
          <h1 className="text-2xl font-semibold">Editar empresa</h1>
        </div>
        {company.id !== undefined && (
          <Button variant="outline" nativeButton={false} render={<Link href={`/empresas/${company.id}/usuarios`} />}>
            <Users className="size-4" />
            Ver usuarios
          </Button>
        )}
      </div>

      <EmpresaForm mode="edit" initial={company} />

      {/* Migraciones remotas -- correr antes de habilitar funcionalidad nueva en el portal Web */}
      {company.id !== undefined && (
        <RemoteMigrationsSection companyId={company.id} />
      )}

      {/* Módulos y tabs */}
      {company.id !== undefined && (
        <CompanyConfigSection companyId={company.id} />
      )}

      {/* Historial de pings */}
      {company.id !== undefined && (
        <div className="rounded-xl border bg-card shadow-sm p-5">
          <PingHistoryChart companyId={company.id} />
        </div>
      )}

      {/* Zona de peligro */}
      {CAN_DELETE_COMPANY && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 flex flex-col gap-3">
          <div>
            <h2 className="font-medium text-base text-destructive">Zona de peligro</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Elimina permanentemente esta empresa y todos sus usuarios/accesos. No disponible en producción.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 self-start rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-colors"
          >
            {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            {deleting ? 'Eliminando…' : 'Eliminar empresa'}
          </button>
        </div>
      )}
    </div>
  );
}
