'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Copy, DatabaseZap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Banner } from '@/components/ui/Banner';
import { adminFetch, ApiError } from '@/lib/api';

/**
 * Genera (no ejecuta) el script T-SQL para clonar la BD remota de esta empresa a
 * una copia de QA/DEMO -- backup/restore WITH MOVE a G:\SODISA\Data\DEMO\ +
 * neutralización de OS12T. El operador copia el resultado y lo corre a mano en
 * SSMS; este componente nunca ejecuta nada contra la base de datos real.
 */
export function QaCopyScriptSection({ companyId, sourceDatabase }: { companyId: number; sourceDatabase: string }) {
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [script, setScript] = useState<string | null>(null);

  function reset() {
    setNombre('');
    setError(null);
    setScript(null);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  async function handleGenerate() {
    const nombreLimpio = nombre.trim();
    if (!/^[A-Za-z0-9_]+$/.test(nombreLimpio)) {
      setError('El nombre solo puede tener letras, números y guion bajo.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{ script: string }>(
        `/portal/companies/${companyId}/qa-copy-script?nuevaBaseDeDatos=${encodeURIComponent(nombreLimpio)}`,
      );
      setScript(data.script);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al generar el script.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!script) return;
    await navigator.clipboard.writeText(script);
    toast.success('Script copiado al portapapeles');
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm p-5 flex flex-col gap-3">
      <div>
        <h2 className="text-base font-semibold">Copia a QA</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Genera el script de backup/restore + limpieza de OS12T para clonar{' '}
          <span className="font-mono">{sourceDatabase}</span> a una base de datos de QA/DEMO en la misma instancia.
          El script no se ejecuta desde aquí -- se revisa y corre a mano en SSMS.
        </p>
      </div>

      <Button size="sm" variant="outline" className="self-start" onClick={() => setOpen(true)}>
        <DatabaseZap className="size-4" />
        Generar script de copia a QA
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="w-[90vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Copiar {sourceDatabase} a QA</DialogTitle>
            <DialogDescription>
              Solo genera el script -- no crea ninguna base de datos ni toca producción. Debe correrse manualmente en
              SSMS, en la misma instancia donde vive {sourceDatabase}.
            </DialogDescription>
          </DialogHeader>

          {!script ? (
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nombre de la nueva base de datos</label>
                <input
                  autoFocus
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
                  placeholder={`${sourceDatabase}_DEMO`}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-mono"
                />
              </div>
              {error && <Banner variant="error" message={error} dismissible={false} />}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <textarea
                readOnly
                value={script}
                rows={16}
                className="w-full rounded-lg border border-input bg-muted/30 p-3 text-xs font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Revisa el <span className="font-mono">PRINT</span> del Paso 3 en SSMS antes de confiar en el
                resultado -- debería listar solo sentencias <span className="font-mono">ALTER TABLE</span>.
              </p>
            </div>
          )}

          <DialogFooter>
            {!script ? (
              <Button onClick={handleGenerate} disabled={loading || !nombre.trim()}>
                {loading ? 'Generando…' : 'Generar script'}
              </Button>
            ) : (
              <Button onClick={handleCopy}>
                <Copy className="size-4" />
                Copiar al portapapeles
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
