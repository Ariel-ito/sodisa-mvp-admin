'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Loader2, Paintbrush } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Banner } from '@/components/ui/Banner';
import { adminFetch, swrFetcher, ApiError } from '@/lib/api';
import { toast } from 'sonner';

interface CompanyLite { id: number; name: string; slug: string; }

// Mismos presets que el listado de plantillas de la empresa (mvp_app, facturas/plantillas/page.tsx).
const PRESETS = [
  { code: 'Personalizado', label: 'Personalizado (ancho y alto libres)', anchoMm: '', altoMm: '' },
  { code: 'Carta', label: 'Carta — 215.9 x 279.4 mm', anchoMm: '215.9', altoMm: '279.4' },
  { code: 'A4', label: 'A4 — 210 x 297 mm', anchoMm: '210', altoMm: '297' },
  { code: 'Ticket 80mm', label: 'Ticket 80mm — impresora térmica angosta', anchoMm: '80', altoMm: '200' },
  { code: 'Ticket 58mm', label: 'Ticket 58mm — impresora térmica angosta', anchoMm: '58', altoMm: '200' },
];

export interface PlantillaFacturaRecomendadaData {
  id?: number;
  nombre: string;
  descripcion?: string | null;
  anchoMm: number;
  altoMm: number;
  aplicaATodas: boolean;
  companyIds?: number[];
}

interface Props {
  initial?: PlantillaFacturaRecomendadaData;
  mode: 'create' | 'edit';
}

export function PlantillaFacturaRecomendadaForm({ initial, mode }: Props) {
  const router = useRouter();

  const [nombre, setNombre] = useState(initial?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? '');
  const [anchoMm, setAnchoMm] = useState(String(initial?.anchoMm ?? '215.9'));
  const [altoMm, setAltoMm] = useState(String(initial?.altoMm ?? '279.4'));
  const [aplicaATodas, setAplicaATodas] = useState(initial?.aplicaATodas ?? true);
  const [companyIds, setCompanyIds] = useState<number[]>(initial?.companyIds ?? []);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: empresas } = useSWR<CompanyLite[]>('/portal/companies', swrFetcher);

  // El preset seleccionado se deduce del tamaño actual (igual que en la lista de la empresa).
  const presetActual = PRESETS.find((p) => p.anchoMm === anchoMm && p.altoMm === altoMm)?.code ?? 'Personalizado';

  function handlePreset(code: string | null) {
    const preset = PRESETS.find((p) => p.code === code);
    if (!preset || preset.anchoMm === '') return; // "Personalizado": deja ancho/alto como están
    setAnchoMm(preset.anchoMm);
    setAltoMm(preset.altoMm);
  }

  function toggleCompany(id: number) {
    setCompanyIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  const missingFields: string[] = [];
  if (!nombre.trim()) missingFields.push('Nombre');
  if (!anchoMm.trim() || Number(anchoMm) <= 0) missingFields.push('Ancho');
  if (!altoMm.trim() || Number(altoMm) <= 0) missingFields.push('Alto');
  if (!aplicaATodas && companyIds.length === 0) missingFields.push('Al menos una empresa');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (missingFields.length > 0) return;
    setSaving(true);
    setFormError(null);
    try {
      const body = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        anchoMm: Number(anchoMm),
        altoMm: Number(altoMm),
        aplicaATodas,
        companyIds: aplicaATodas ? [] : companyIds,
      };
      if (mode === 'create') {
        const { id } = await adminFetch<{ id: number }>('/portal/plantillas-factura-recomendadas', { method: 'POST', body: JSON.stringify(body) });
        toast.success('Plantilla creada -- ahora diséñala.');
        router.push(`/plantillas-factura-recomendadas/${id}/disenar`);
      } else {
        await adminFetch(`/portal/plantillas-factura-recomendadas/${initial?.id}`, { method: 'PUT', body: JSON.stringify(body) });
        toast.success('Plantilla actualizada correctamente');
        router.push('/plantillas-factura-recomendadas');
      }
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-3xl">
      {formError && <Banner variant="error" title="Error al guardar" message={formError} />}

      <section className="flex flex-col gap-4">
        <h2 className="font-medium text-base border-b pb-2">Datos de la plantilla</h2>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input id="nombre" value={nombre} maxLength={80} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Factura Carta — Diseño SODISA" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea id="descripcion" value={descripcion ?? ''} maxLength={500} rows={2} onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Lo que verá la empresa en la tarjeta de Recomendadas" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Tamaño de página</Label>
          <Select value={presetActual} onValueChange={handlePreset}>
            <SelectTrigger className="w-full sm:w-96"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRESETS.map((p) => <SelectItem key={p.code} value={p.code}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:w-96">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ancho">Ancho (mm) *</Label>
            <Input id="ancho" type="number" step="0.1" min="1" value={anchoMm} onChange={(e) => setAnchoMm(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="alto">Alto (mm) *</Label>
            <Input id="alto" type="number" step="0.1" min="1" value={altoMm} onChange={(e) => setAltoMm(e.target.value)} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          El diseño (logo, bloques, colores) se edita después, en el diseñador visual — acá solo defines el nombre y el tamaño de página.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium text-base border-b pb-2">Empresas</h2>
        <div className="flex items-start gap-2 rounded-lg border p-3">
          <Checkbox id="aplicaATodas" checked={aplicaATodas} onCheckedChange={(c) => setAplicaATodas(c === true)} />
          <Label htmlFor="aplicaATodas" className="flex flex-col gap-0.5 font-normal cursor-pointer">
            <span className="font-medium">Aplica a todas las empresas</span>
            <span className="text-xs text-muted-foreground">Si lo desactivas, elige abajo a cuáles empresas se les asigna.</span>
          </Label>
        </div>
        {!aplicaATodas && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-lg border p-3 max-h-56 overflow-y-auto">
            {(empresas ?? []).map((e) => (
              <div key={e.id} className="flex items-center gap-2">
                <Checkbox id={`emp-${e.id}`} checked={companyIds.includes(e.id)} onCheckedChange={() => toggleCompany(e.id)} />
                <Label htmlFor={`emp-${e.id}`} className="font-normal truncate" title={e.name}>{e.name}</Label>
              </div>
            ))}
          </div>
        )}
      </section>

      {missingFields.length > 0 && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Faltan: <strong>{missingFields.join(', ')}</strong>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 mt-2">
        <Button type="submit" disabled={saving || missingFields.length > 0}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : mode === 'create' ? <Paintbrush className="size-4" /> : null}
          {saving ? 'Guardando…' : mode === 'create' ? 'Crear y abrir el diseñador' : 'Guardar cambios'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
