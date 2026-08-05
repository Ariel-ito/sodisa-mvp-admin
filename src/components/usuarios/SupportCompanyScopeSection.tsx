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
}

interface Props {
  userId: number;
}

/**
 * Empresas que este usuario SUPPORT puede administrar desde el panel (usuarios,
 * roles, permisos de esas empresas). NO otorga una identidad de impersonación
 * dentro de la empresa -- eso es "Acceso a empresas" arriba, un concepto distinto.
 */
export function SupportCompanyScopeSection({ userId }: Props) {
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

  const assignedIds = new Set((accesses ?? []).map((a) => a.companyId));
  const available = (companies ?? []).filter((c) => !assignedIds.has(c.id));

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
    if (!confirm(`¿Quitar la empresa "${companyName}" de este usuario de Soporte?`)) return;
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
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-2">
        <div>
          <h2 className="font-medium text-base">Empresas que puede administrar</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Empresas donde este usuario de Soporte puede gestionar usuarios, roles y permisos desde el panel. No incluye configuración/conexión de la empresa.
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
