'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { adminFetch, swrFetcher } from '@/lib/api';

interface Config {
  modules:  string[];
  statTabs: string[];
}

const MODULES = [
  { id: 'billing',    label: 'Facturación',       description: 'Creación y gestión de facturas' },
  { id: 'pos',        label: 'Punto de Venta',     description: 'Operaciones de caja y ventas' },
  { id: 'stats',      label: 'Insights / Stats',   description: 'Análisis y reportes de ventas' },
  { id: 'scheduling', label: 'Horarios Escolares', description: 'Generación de horarios de clases' },
];

const STAT_TABS = [
  { id: 'resumen',    label: 'Resumen' },
  { id: 'ventas',     label: 'Ventas' },
  { id: 'articulos',  label: 'Artículos' },
  { id: 'clientes',   label: 'Clientes' },
  { id: 'inventario', label: 'Inventario' },
];

export function CompanyConfigSection({ companyId }: { companyId: number }) {
  const { data, isLoading, mutate } = useSWR<Config>(`/portal/companies/${companyId}/config`, swrFetcher);
  const [saving, setSaving] = useState(false);

  const [modules,  setModules]  = useState<string[] | null>(null);
  const [statTabs, setStatTabs] = useState<string[] | null>(null);

  // Use SWR data as source of truth until user makes changes
  const effectiveModules  = modules  ?? data?.modules  ?? [];
  const effectiveStatTabs = statTabs ?? data?.statTabs ?? [];

  const toggleModule = (id: string) => {
    const current = effectiveModules;
    setModules(current.includes(id) ? current.filter((m) => m !== id) : [...current, id]);
    // If stats is being removed, clear stat tabs selection too
    if (id === 'stats' && current.includes(id)) {
      setStatTabs([]);
    }
  };

  const toggleStatTab = (id: string) => {
    const current = effectiveStatTabs;
    setStatTabs(current.includes(id) ? current.filter((t) => t !== id) : [...current, id]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminFetch(`/portal/companies/${companyId}/config`, {
        method: 'PUT',
        body: JSON.stringify({ modules: effectiveModules, statTabs: effectiveStatTabs }),
      });
      await mutate();
      // Reset local state so SWR data is authoritative again
      setModules(null);
      setStatTabs(null);
      toast.success('Configuración guardada');
    } catch {
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    modules  !== null ||
    statTabs !== null;

  const statsEnabled = effectiveModules.includes('stats');

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card shadow-sm p-5">
        <p className="text-sm text-muted-foreground">Cargando configuración…</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm p-5 flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold">Módulos activos</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Si no hay módulos seleccionados, el usuario verá todos los que tenga permiso.
          Al seleccionar al menos uno, solo esos son visibles.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MODULES.map((mod) => {
          const active = effectiveModules.includes(mod.id);
          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => toggleModule(mod.id)}
              className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                active
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/40'
              }`}
            >
              <div className={`mt-0.5 h-4 w-4 flex-shrink-0 rounded border-2 flex items-center justify-center ${
                active ? 'border-primary bg-primary' : 'border-muted-foreground/40'
              }`}>
                {active && (
                  <svg className="h-2.5 w-2.5 text-primary-foreground" fill="none" viewBox="0 0 10 10" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 5l2.5 2.5 4.5-4.5" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-medium leading-none">{mod.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{mod.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Stat tabs — only shown when stats module is enabled */}
      {statsEnabled && (
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold mb-1">Tabs de Insights</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Sin selección = todas las tabs visibles. Al seleccionar al menos una, solo esas se muestran.
          </p>
          <div className="flex flex-wrap gap-2">
            {STAT_TABS.map((tab) => {
              const active = effectiveStatTabs.includes(tab.id);
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => toggleStatTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    active
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-muted-foreground/50'
                  }`}
                >
                  {active && (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 10 10" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 5l2.5 2.5 4.5-4.5" />
                    </svg>
                  )}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {hasChanges && (
        <div className="flex justify-end border-t pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Guardando…' : 'Guardar configuración'}
          </button>
        </div>
      )}
    </div>
  );
}
