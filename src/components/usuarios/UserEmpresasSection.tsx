'use client';

import useSWR from 'swr';
import { useState } from 'react';
import Link from 'next/link';
import { adminFetch, swrFetcher, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, Building2, ExternalLink, Loader2 } from 'lucide-react';

interface UcaRow {
  id: number;
  companyId: number;
  companyName: string;
  isActive: boolean;
  externalId: string | null;
  roles: string[];
}

interface Company {
  id: number;
  name: string;
  slug: string;
}

interface Props {
  userId: number;
  userEmail: string;
}

export function UserEmpresasSection({ userId, userEmail }: Props) {
  const {
    data: accesses,
    isLoading: loadingAccesses,
    mutate,
  } = useSWR<UcaRow[]>(`/portal/access?userId=${userId}`, swrFetcher);

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
      await adminFetch('/portal/access', {
        method: 'POST',
        body: JSON.stringify({ companyId: Number(selectedCompanyId), email: userEmail }),
      });
      toast.success('Acceso a empresa agregado');
      setShowAdd(false);
      setSelectedCompanyId('');
      mutate();
    } catch (err) {
      toast.error('Error al agregar', {
        description: err instanceof ApiError ? err.message : 'Error desconocido',
      });
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(ucaId: number, companyName: string) {
    if (!confirm(`¿Quitar acceso a "${companyName}"? Los roles y permisos del usuario en esa empresa también se eliminarán.`)) return;
    setRemovingId(ucaId);
    try {
      await adminFetch(`/portal/access/${ucaId}`, { method: 'DELETE' });
      toast.success(`Acceso a "${companyName}" eliminado`);
      mutate();
    } catch (err) {
      toast.error('Error al eliminar', {
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
          <h2 className="font-medium text-base">Acceso a empresas</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Empresas a las que este usuario puede ingresar desde el portal de facturación
          </p>
        </div>
        {!showAdd && available.length > 0 && (
          <Button type="button" variant="outline" size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="size-3.5" />
            Agregar empresa
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
            {adding ? 'Agregando…' : 'Agregar'}
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
          Cargando accesos…
        </div>
      ) : !accesses || accesses.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          Este usuario no tiene acceso a ninguna empresa todavía.
        </p>
      ) : (
        <div className="flex flex-col divide-y border rounded-lg overflow-hidden">
          {accesses.map((uca) => (
            <div key={uca.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
              <Building2 className="size-4 text-muted-foreground shrink-0" />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{uca.companyName}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                  <Badge variant={uca.isActive ? 'default' : 'secondary'} className="text-xs">
                    {uca.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                  {uca.roles.length > 0 ? (
                    uca.roles.map((r) => (
                      <Badge key={r} variant="secondary" className="text-xs capitalize">
                        {r}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">Sin roles</span>
                  )}
                  {uca.externalId && (
                    <span className="text-xs text-muted-foreground font-mono">
                      BIC: {uca.externalId}
                    </span>
                  )}
                </div>
              </div>

              {/* Link to full access form */}
              <Link
                href={`/empresas/${uca.companyId}/usuarios/${uca.id}`}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Editar acceso completo (roles, permisos, PIN…)"
              >
                <ExternalLink className="size-4" />
              </Link>

              {/* Remove button */}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title="Quitar acceso a esta empresa"
                disabled={removingId === uca.id}
                onClick={() => handleRemove(uca.id, uca.companyName)}
                className="text-muted-foreground hover:text-destructive"
              >
                {removingId === uca.id ? (
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
