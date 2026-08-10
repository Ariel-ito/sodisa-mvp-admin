'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { CheckCircle2, Circle, Loader2, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminFetch, ApiError, swrFetcher } from '@/lib/api';

interface RemoteMigrationStatus {
  id: string;
  descripcion: string;
  aplicado: boolean;
  fechaEjecucion: string | null;
}

interface RemoteMigrationRunResult {
  id: string;
  descripcion: string;
  ok: boolean;
  mensaje: string;
}

/**
 * Migraciones que corren contra la BD REMOTA de la empresa (no la del portal) --
 * ej. crear tablas nuevas o migrar datos desde el schema legacy. Se disparan a mano,
 * una empresa a la vez, porque cada una adopta funcionalidad del portal Web en
 * momentos distintos mientras el sistema legacy sigue en uso en paralelo.
 */
export function RemoteMigrationsSection({ companyId }: { companyId: number }) {
  const { data, isLoading, mutate } = useSWR<RemoteMigrationStatus[]>(
    `/portal/companies/${companyId}/remote-migrations`,
    swrFetcher,
  );
  const [running, setRunning] = useState(false);
  const [lastResults, setLastResults] = useState<RemoteMigrationRunResult[] | null>(null);

  const pendientes = data?.filter((s) => !s.aplicado) ?? [];

  const handleRun = async () => {
    setRunning(true);
    setLastResults(null);
    try {
      const results = await adminFetch<RemoteMigrationRunResult[]>(
        `/portal/companies/${companyId}/remote-migrations/run`,
        { method: 'POST' },
      );
      setLastResults(results);
      await mutate();
      const fallidos = results.filter((r) => !r.ok);
      if (fallidos.length) {
        toast.error(`${fallidos.length} migración(es) fallaron -- revisa el detalle abajo`);
      } else if (results.length) {
        toast.success('Migraciones ejecutadas correctamente');
      } else {
        toast.success('No había migraciones pendientes');
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al ejecutar migraciones');
    } finally {
      setRunning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card shadow-sm p-5">
        <p className="text-sm text-muted-foreground">Cargando migraciones remotas…</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Migraciones remotas</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cambios contra la base de datos remota de esta empresa (no la del portal).
            Ejecuta las pendientes antes de habilitar la funcionalidad correspondiente en el portal Web.
          </p>
        </div>
        <Button onClick={handleRun} disabled={running || pendientes.length === 0} size="sm">
          {running ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Ejecutando…
            </>
          ) : (
            <>
              <PlayCircle className="size-4" />
              Ejecutar pendientes
            </>
          )}
        </Button>
      </div>

      <ul className="flex flex-col divide-y">
        {(data ?? []).map((step) => {
          const result = lastResults?.find((r) => r.id === step.id);
          return (
            <li key={step.id} className="flex items-start gap-3 py-3">
              {step.aplicado ? (
                <CheckCircle2 className="size-4 text-green-500 mt-0.5 shrink-0" />
              ) : (
                <Circle className="size-4 text-muted-foreground/50 mt-0.5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{step.descripcion}</p>
                {step.aplicado && step.fechaEjecucion && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Aplicada el {new Date(step.fechaEjecucion).toLocaleString()}
                  </p>
                )}
                {result && (
                  <p className={`text-xs mt-1 ${result.ok ? 'text-green-600' : 'text-destructive'}`}>
                    {result.mensaje}
                  </p>
                )}
              </div>
            </li>
          );
        })}
        {(data ?? []).length === 0 && (
          <li className="py-3 text-sm text-muted-foreground">No hay migraciones registradas todavía.</li>
        )}
      </ul>
    </div>
  );
}
