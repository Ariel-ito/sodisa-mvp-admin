'use client';

import useSWR from 'swr';
import { useState } from 'react';
import { adminFetch, swrFetcher, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Plus, Trash2, Building2, Loader2 } from 'lucide-react';

interface SupportAccessRow {
  id: number;
  companyId: number;
  company: { id: number; name: string; slug: string };
}

interface Company {
  id: number;
  name: string;
  slug: string;
  isDemo?: boolean;
}

interface Props {
  userId: number;
  /** QA además tiene acceso automático a las empresas isDemo=true -- ver sección
   *  de solo-lectura que se agrega arriba de la lista cuando role='qa'. */
  role: 'support' | 'qa';
}

/**
 * Empresas asignadas manualmente a este usuario (SUPPORT o QA) para administrar
 * desde el panel (usuarios, roles, permisos de esas empresas). NO otorga una
 * identidad de impersonación dentro de la empresa -- eso es "Acceso a empresas"
 * arriba, un concepto distinto. Para QA, esto es ADICIONAL a su acceso
 * automático a empresas demo (mostrado arriba, de solo lectura).
 */
export function SupportCompanyScopeSection({ userId, role }: Props) {
  const {
    data: accesses,
    isLoading: loadingAccesses,
    mutate,
  } = useSWR<SupportAccessRow[]>(`/portal/support-access?userId=${userId}`, swrFetcher);

  const { data: companies } = useSWR<Company[]>('/portal/companies', swrFetcher);

  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const demoCompanies = role === 'qa' ? (companies ?? []).filter((c) => c.isDemo) : [];
  const assignedIds = new Set((accesses ?? []).map((a) => a.companyId));
  // Para QA no tiene sentido ofrecer una empresa demo en "asignar manualmente"
  // -- ya la ve automáticamente, asignarla de nuevo sería un no-op confuso.
  const available = (companies ?? []).filter((c) => !assignedIds.has(c.id) && !c.isDemo);

  async function handleAdd() {
    if (!selectedCompanyId) return;
    setAdding(true);
    try {
      await adminFetch('/portal/support-access', {
        method: 'POST',
        body: JSON.stringify({ userId, companyId: Number(selectedCompanyId) }),
      });
      toast.success('Empresa asignada correctamente');
      setShowAdd(false);
      setSelectedCompanyId('');
      mutate();
    } catch (err) {
      toast.error('Error al asignar', {
        description: err instanceof ApiError ? err.message : 'Error desconocido',
      });
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(id: number, companyName: string) {
    if (!confirm(`¿Quitar la empresa "${companyName}" asignada a este usuario?`)) return;
    setRemovingId(id);
    try {
      await adminFetch(`/portal/support-access/${id}`, { method: 'DELETE' });
      toast.success(`"${companyName}" quitada correctamente`);
      mutate();
    } catch (err) {
      toast.error('Error al quitar', {
        description: err instanceof ApiError ? err.message : 'Error desconocido',
      });
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <section className="flex flex-col gap-3">
      {/* Empresas demo -- acceso automático de QA, solo lectura */}
      {role === 'qa' && (
        <div className="flex flex-col gap-2">
          <div>
            <h2 className="font-medium text-base flex items-center gap-2">
              Empresas demo
              <span className="text-[11px] font-normal px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Automático · QA</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Todo usuario QA ve estas empresas automáticamente (isDemo=true) — no requieren asignación y no se pueden quitar acá.
            </p>
          </div>
          {demoCompanies.length === 0 ? (
            <p className="text-sm text-muted-foreground py-1">No hay empresas marcadas como demo todavía.</p>
          ) : (
            <div className="flex flex-col divide-y border rounded-lg overflow-hidden">
              {demoCompanies.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                  <Building2 className="size-4 text-blue-500 shrink-0" />
                  <p className="text-sm font-medium truncate flex-1 min-w-0">{c.name}</p>
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 shrink-0">Demo</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b pb-2">
        <div>
          <h2 className="font-medium text-base flex items-center gap-2">
            {role === 'qa' ? 'Empresas asignadas manualmente' : 'Empresas que puede administrar'}
            {role === 'qa' && (
              <span className="text-[11px] font-normal px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Manual</span>
            )}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {role === 'qa'
              ? 'Empresas NO demo que este usuario QA puede acceder puntualmente (ej. reproducir un bug en una empresa real), además de las demos automáticas de arriba.'
              : 'Empresas donde este usuario de Soporte puede gestionar usuarios, roles y permisos desde el panel. No incluye configuración/conexión de la empresa.'}
          </p>
        </div>
        {!showAdd && available.length > 0 && (
          <Button type="button" variant="outline" size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="size-3.5" />
            Asignar empresa
          </Button>
        )}
      </div>

      {/* Add row */}
      {showAdd && (
        <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/40">
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="flex-1 h-8 rounded-lg border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Selecciona empresa…</option>
            {available.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Button
            type="button"
            size="sm"
            onClick={handleAdd}
            disabled={!selectedCompanyId || adding}
          >
            {adding && <Loader2 className="size-3.5 animate-spin" />}
            {adding ? 'Asignando…' : 'Asignar'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowAdd(false);
              setSelectedCompanyId('');
            }}
          >
            Cancelar
          </Button>
        </div>
      )}

      {/* List */}
      {loadingAccesses ? (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="size-3.5 animate-spin" />
          Cargando empresas asignadas…
        </div>
      ) : !accesses || accesses.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          Este usuario no tiene ninguna empresa asignada todavía.
        </p>
      ) : (
        <div className="flex flex-col divide-y border rounded-lg overflow-hidden">
          {accesses.map((access) => (
            <div key={access.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
              <Building2 className="size-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{access.company?.name}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title="Quitar esta empresa"
                disabled={removingId === access.id}
                onClick={() => handleRemove(access.id, access.company?.name ?? '')}
                className="text-muted-foreground hover:text-destructive"
              >
                {removingId === access.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
