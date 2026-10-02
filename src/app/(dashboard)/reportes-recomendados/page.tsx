'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminFetch, ApiError, swrFetcher } from '@/lib/api';
import { toast } from 'sonner';

interface ReporteRecomendado {
  id: number;
  nombre: string;
  descripcion: string | null;
  fuente: string;
  aplicaATodas: boolean;
}

const FUENTE_LABEL: Record<string, string> = { articulos: 'Artículos' };

export default function ReportesRecomendadosPage() {
  const { data: reportes, isLoading, mutate } = useSWR<ReporteRecomendado[]>('/portal/reportes-recomendados', swrFetcher);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleDelete(reporte: ReporteRecomendado) {
    const confirmed = window.confirm(`¿Eliminar el reporte recomendado "${reporte.nombre}"?\n\nEsta acción no se puede deshacer.`);
    if (!confirmed) return;

    setDeletingId(reporte.id);
    try {
      await adminFetch(`/portal/reportes-recomendados/${reporte.id}`, { method: 'DELETE' });
      toast.success('Reporte recomendado eliminado correctamente');
      await mutate();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al eliminar el reporte recomendado');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Reportes Recomendados</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Plantillas de reporte que SODISA arma y asigna a empresas</p>
        </div>
        <Button nativeButton={false} render={<Link href="/reportes-recomendados/nuevo" />} className="shrink-0">
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nuevo reporte</span>
          <span className="sm:hidden">Nuevo</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Cargando…</div>
      ) : (
        <>
          <div className="hidden md:block rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Fuente</TableHead>
                  <TableHead>Empresas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportes?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No hay reportes recomendados registrados.
                    </TableCell>
                  </TableRow>
                )}
                {reportes?.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.nombre}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{r.descripcion}</TableCell>
                    <TableCell className="text-sm">{FUENTE_LABEL[r.fuente] ?? r.fuente}</TableCell>
                    <TableCell>
                      {r.aplicaATodas ? <Badge>Todas</Badge> : <Badge variant="secondary">Específicas</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-0.5">
                        <Button variant="ghost" size="icon-sm" title="Editar"
                          nativeButton={false} render={<Link href={`/reportes-recomendados/${r.id}`} />}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon-sm" title="Eliminar"
                          disabled={deletingId === r.id}
                          onClick={() => handleDelete(r)}
                          className="text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                        >
                          {deletingId === r.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden flex flex-col gap-3">
            {reportes?.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No hay reportes recomendados registrados.</p>
            )}
            {reportes?.map(r => (
              <div key={r.id} className="rounded-xl border bg-card shadow-sm p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-sm truncate">{r.nombre}</span>
                    {r.aplicaATodas ? <Badge className="text-xs shrink-0">Todas</Badge> : <Badge variant="secondary" className="text-xs shrink-0">Específicas</Badge>}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button variant="ghost" size="icon-sm" title="Editar"
                      nativeButton={false} render={<Link href={`/reportes-recomendados/${r.id}`} />}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon-sm" title="Eliminar"
                      disabled={deletingId === r.id}
                      onClick={() => handleDelete(r)}
                      className="text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                    >
                      {deletingId === r.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    </Button>
                  </div>
                </div>
                {r.descripcion && <p className="text-xs text-muted-foreground">{r.descripcion}</p>}
                <span className="text-xs text-muted-foreground">Fuente: {FUENTE_LABEL[r.fuente] ?? r.fuente}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
