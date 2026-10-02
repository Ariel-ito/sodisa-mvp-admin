'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Plus, Pencil, Paintbrush, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminFetch, ApiError, swrFetcher } from '@/lib/api';
import { toast } from 'sonner';

interface PlantillaRecomendada {
  id: number;
  nombre: string;
  descripcion: string | null;
  anchoMm: number;
  altoMm: number;
  aplicaATodas: boolean;
}

export default function PlantillasFacturaRecomendadasPage() {
  const { data: plantillas, isLoading, mutate } = useSWR<PlantillaRecomendada[]>('/portal/plantillas-factura-recomendadas', swrFetcher);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleDelete(plantilla: PlantillaRecomendada) {
    const confirmed = window.confirm(
      `¿Eliminar la plantilla recomendada "${plantilla.nombre}"?\n\nLas empresas que ya la clonaron conservan su copia. Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    setDeletingId(plantilla.id);
    try {
      await adminFetch(`/portal/plantillas-factura-recomendadas/${plantilla.id}`, { method: 'DELETE' });
      toast.success('Plantilla recomendada eliminada correctamente');
      await mutate();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al eliminar la plantilla recomendada');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Plantillas de Factura Recomendadas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Plantillas de factura que SODISA diseña y asigna a empresas para que las clonen</p>
        </div>
        <Button nativeButton={false} render={<Link href="/plantillas-factura-recomendadas/nuevo" />} className="shrink-0">
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nueva plantilla</span>
          <span className="sm:hidden">Nueva</span>
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
                  <TableHead>Tamaño</TableHead>
                  <TableHead>Empresas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plantillas?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No hay plantillas recomendadas registradas.
                    </TableCell>
                  </TableRow>
                )}
                {plantillas?.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nombre}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{p.descripcion}</TableCell>
                    <TableCell className="text-sm">{p.anchoMm} x {p.altoMm} mm</TableCell>
                    <TableCell>
                      {p.aplicaATodas ? <Badge>Todas</Badge> : <Badge variant="secondary">Específicas</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-0.5">
                        <Button variant="ghost" size="icon-sm" title="Abrir el diseñador"
                          nativeButton={false} render={<Link href={`/plantillas-factura-recomendadas/${p.id}/disenar`} />}>
                          <Paintbrush className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" title="Editar datos y empresas"
                          nativeButton={false} render={<Link href={`/plantillas-factura-recomendadas/${p.id}`} />}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon-sm" title="Eliminar"
                          disabled={deletingId === p.id}
                          onClick={() => handleDelete(p)}
                          className="text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                        >
                          {deletingId === p.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden flex flex-col gap-3">
            {plantillas?.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No hay plantillas recomendadas registradas.</p>
            )}
            {plantillas?.map((p) => (
              <div key={p.id} className="rounded-xl border bg-card shadow-sm p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-sm truncate">{p.nombre}</span>
                    {p.aplicaATodas ? <Badge className="text-xs shrink-0">Todas</Badge> : <Badge variant="secondary" className="text-xs shrink-0">Específicas</Badge>}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button variant="ghost" size="icon-sm" title="Abrir el diseñador"
                      nativeButton={false} render={<Link href={`/plantillas-factura-recomendadas/${p.id}/disenar`} />}>
                      <Paintbrush className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" title="Editar datos y empresas"
                      nativeButton={false} render={<Link href={`/plantillas-factura-recomendadas/${p.id}`} />}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon-sm" title="Eliminar"
                      disabled={deletingId === p.id}
                      onClick={() => handleDelete(p)}
                      className="text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                    >
                      {deletingId === p.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    </Button>
                  </div>
                </div>
                {p.descripcion && <p className="text-xs text-muted-foreground">{p.descripcion}</p>}
                <span className="text-xs text-muted-foreground">Tamaño: {p.anchoMm} x {p.altoMm} mm</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
