'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { adminFetch, ApiError } from '@/lib/api';
import { Loader2, Search, UserCheck } from 'lucide-react';

interface BicEntity {
  CODIGO_BIC: string;
  NOMBRE: string;
  PDV_CODIGO: string | null;
  PDV_NOMBRE: string | null;
  RELACION: string | null;
  ROL_BIC: 'vendedor' | 'cajero' | 'cobrador';
}

type BicRole = 'vendedor' | 'cajero' | 'cobrador';

const ROLES: { value: BicRole; label: string; color: string }[] = [
  { value: 'vendedor',  label: 'Vendedor',  color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'cajero',   label: 'Cajero',    color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'cobrador', label: 'Cobrador',  color: 'bg-orange-100 text-orange-800 border-orange-300' },
];

const ROL_COLOR: Record<BicRole, string> = {
  vendedor:  'bg-blue-100 text-blue-800 border-blue-200',
  cajero:    'bg-green-100 text-green-800 border-green-200',
  cobrador:  'bg-orange-100 text-orange-800 border-orange-200',
};

/** RELACION_CON_PUNTO_DE_VEN: 1=Cajero, 2=Vendedor, 4=Facturador, 5=Supervisor */
const RELACION_LABELS: Record<string, string> = {
  '1': 'Cajero',
  '2': 'Vendedor',
  '4': 'Facturador',
  '5': 'Supervisor',
};

interface Props {
  companyId: number;
  open: boolean;
  onClose: () => void;
  onSelect: (codigoBic: string, nombre: string) => void;
  currentExternalId?: string | null;
}

export function BicSearchModal({ companyId, open, onClose, onSelect, currentExternalId }: Props) {
  // null = sin filtro activo (ver todos igualados)
  const [activeRole, setActiveRole] = useState<BicRole | null>(null);
  const [results, setResults] = useState<BicEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentRowRef = useRef<HTMLTableRowElement | null>(null);

  // Fetch una sola vez al abrir (siempre trae todos los empleados)
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function fetchEntities() {
      setLoading(true);
      setError(null);
      try {
        const data = await adminFetch<BicEntity[]>(
          `/portal/companies/${companyId}/bic-entities`,
        );
        if (!cancelled) setResults(data ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : 'Error al conectar con el sistema remoto.',
          );
          setResults([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchEntities();
    return () => { cancelled = true; };
  }, [open, companyId]);

  // Reset filtro al cerrar
  useEffect(() => {
    if (!open) setActiveRole(null);
  }, [open]);

  // Scroll automático al empleado actualmente seleccionado
  useEffect(() => {
    if (!loading && currentRowRef.current) {
      currentRowRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [loading]);

  // Ordena: los del rol activo primero, el resto después — sin ocultar nada
  const sorted = useMemo(() => {
    if (!activeRole) return results;
    return [
      ...results.filter(e => e.ROL_BIC === activeRole),
      ...results.filter(e => e.ROL_BIC !== activeRole),
    ];
  }, [results, activeRole]);

  function handleSelect(entity: BicEntity) {
    onSelect(entity.CODIGO_BIC.trim(), entity.NOMBRE.trim());
    onClose();
  }

  function toggleRole(role: BicRole) {
    setActiveRole(prev => (prev === role ? null : role));
  }

  return (
    <Dialog open={open} onOpenChange={val => { if (!val) onClose(); }}>
      <DialogContent className="w-[90vw] sm:max-w-5xl max-h-[85vh] flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Search className="size-5 text-muted-foreground" />
            Buscar empleado en sistema BIC
          </DialogTitle>
          <DialogDescription>
            Se listan todos los empleados registrados en la empresa. Usa los filtros para
            resaltar por tipo de registro. Haz clic en una fila para asignar el código BIC.
          </DialogDescription>
        </DialogHeader>

        {/* Filtros de rol — actúan como highlight, no ocultan filas */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Resaltar:</span>
          {ROLES.map(r => (
            <button
              key={r.value}
              type="button"
              onClick={() => toggleRole(r.value)}
              className={[
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium transition-all',
                activeRole === r.value
                  ? r.color + ' ring-2 ring-offset-1 ring-current'
                  : 'bg-muted text-muted-foreground border-border hover:bg-accent',
              ].join(' ')}
            >
              {r.label}
              {activeRole === r.value && (
                <span className="opacity-60 text-[10px]">✕</span>
              )}
            </button>
          ))}
          {activeRole && (
            <button
              type="button"
              onClick={() => setActiveRole(null)}
              className="text-xs text-muted-foreground hover:text-foreground underline ml-1"
            >
              Quitar filtro
            </button>
          )}
        </div>

        {/* Tabla de resultados */}
        <div className="flex-1 overflow-y-auto rounded border min-h-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground text-sm">
              <Loader2 className="size-5 animate-spin" />
              Cargando empleados…
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-destructive text-sm">
              <span>⚠️ {error}</span>
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
              No se encontraron empleados en el sistema.
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead className="bg-muted text-muted-foreground sticky top-0 z-10">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold whitespace-nowrap w-32">Código BIC</th>
                  <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Nombre</th>
                  <th className="text-left px-4 py-3 font-semibold whitespace-nowrap w-24">Rol BIC</th>
                  <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Punto de Venta</th>
                  <th className="text-left px-4 py-3 font-semibold whitespace-nowrap w-28">Relación PdV</th>
                  <th className="px-4 py-3 w-28" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((entity, i) => {
                  const isHighlighted = activeRole === null || entity.ROL_BIC === activeRole;
                  const rolMeta = ROLES.find(r => r.value === entity.ROL_BIC);
                  const isCurrent = !!currentExternalId &&
                    entity.CODIGO_BIC?.trim().toUpperCase() === currentExternalId.trim().toUpperCase();

                  return (
                    <tr
                      key={entity.CODIGO_BIC + i}
                      ref={isCurrent ? currentRowRef : null}
                      className={[
                        'border-t cursor-pointer transition-colors',
                        isCurrent
                          ? 'bg-blue-50 hover:bg-blue-100'
                          : isHighlighted
                            ? 'hover:bg-accent'
                            : 'opacity-40 hover:opacity-70 hover:bg-accent',
                      ].join(' ')}
                      onClick={() => handleSelect(entity)}
                    >
                      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isCurrent && (
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 shrink-0">
                              <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="currentColor">
                                <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                              </svg>
                            </span>
                          )}
                          <span className={isCurrent ? 'font-semibold text-blue-700' : ''}>
                            {entity.CODIGO_BIC?.trim()}
                          </span>
                        </div>
                      </td>
                      <td className={[
                        'px-4 py-3 whitespace-nowrap',
                        isCurrent ? 'font-semibold text-blue-700' : isHighlighted ? 'font-medium' : '',
                      ].join(' ')}>
                        {entity.NOMBRE?.trim()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={[
                          'inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium',
                          rolMeta ? rolMeta.color : '',
                        ].join(' ')}>
                          {rolMeta?.label ?? entity.ROL_BIC}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {entity.PDV_NOMBRE?.trim() ? (
                          <span className="text-foreground">
                            {entity.PDV_NOMBRE.trim()}{' '}
                            <span className="text-xs text-muted-foreground">
                              ({entity.PDV_CODIGO?.trim()})
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {entity.RELACION?.trim() ? (
                          <Badge variant="secondary" className="text-xs font-medium">
                            {RELACION_LABELS[entity.RELACION.trim()] ?? entity.RELACION.trim()}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600">
                            <UserCheck className="size-3.5" />
                            Actual
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                            onClick={e => { e.stopPropagation(); handleSelect(entity); }}
                          >
                            <UserCheck className="size-3.5" />
                            Seleccionar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between">
          {!loading && sorted.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {sorted.length} empleado{sorted.length !== 1 ? 's' : ''}
              {activeRole && (
                <> · <span className="font-medium">{sorted.filter(e => e.ROL_BIC === activeRole).length}</span> {activeRole}s resaltados</>
              )}
            </span>
          )}
          <Button type="button" variant="outline" onClick={onClose} className="ml-auto">
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
