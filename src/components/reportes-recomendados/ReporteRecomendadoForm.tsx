'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Banner } from '@/components/ui/Banner';
import { adminFetch, swrFetcher, ApiError } from '@/lib/api';
import { toast } from 'sonner';

interface Campo { id: string; label: string; tipo: 'texto' | 'numero'; }
interface CompanyLite { id: number; name: string; slug: string; }
interface ValorFila { campo: string; funcion: string; }

// Mismo enum de funciones de agregación que valida el backend (ver
// mvp_api/src/reportes/reportes.service.ts) -- Conteo/Conteo distinto aplican a
// cualquier tipo de campo, el resto solo a campos numéricos.
const FUNCIONES_POR_TIPO: Record<'texto' | 'numero', { value: string; label: string }[]> = {
  texto: [
    { value: 'conteo', label: 'Conteo' },
    { value: 'conteoDistinto', label: 'Conteo distinto' },
  ],
  numero: [
    { value: 'suma', label: 'Suma' },
    { value: 'promedio', label: 'Promedio' },
    { value: 'min', label: 'Mínimo' },
    { value: 'max', label: 'Máximo' },
    { value: 'conteo', label: 'Conteo' },
    { value: 'conteoDistinto', label: 'Conteo distinto' },
  ],
};

export interface ReporteRecomendadoData {
  id?: number;
  nombre: string;
  descripcion?: string | null;
  fuente: string;
  definicion: {
    modo: 'detalle' | 'resumen';
    campos?: string[];
    agruparPor?: string[];
    valores?: ValorFila[];
    mostrarDetalle?: boolean;
  };
  aplicaATodas: boolean;
  companyIds?: number[];
}

interface Props {
  initial?: ReporteRecomendadoData;
  mode: 'create' | 'edit';
}

export function ReporteRecomendadoForm({ initial, mode }: Props) {
  const router = useRouter();

  const [nombre, setNombre] = useState(initial?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? '');
  const [modo, setModo] = useState<'detalle' | 'resumen'>(initial?.definicion.modo ?? 'detalle');
  const [campos, setCampos] = useState<string[]>(initial?.definicion.campos ?? []);
  const [agruparPor, setAgruparPor] = useState<string[]>(initial?.definicion.agruparPor ?? []);
  const [valores, setValores] = useState<ValorFila[]>(initial?.definicion.valores ?? []);
  const [mostrarDetalle, setMostrarDetalle] = useState(initial?.definicion.mostrarDetalle ?? false);
  const [aplicaATodas, setAplicaATodas] = useState(initial?.aplicaATodas ?? true);
  const [companyIds, setCompanyIds] = useState<number[]>(initial?.companyIds ?? []);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: catalogo } = useSWR<Campo[]>('/portal/reportes-recomendados/fuentes/articulos/campos', swrFetcher);
  const { data: empresas } = useSWR<CompanyLite[]>('/portal/companies', swrFetcher);
  const camposPorId = new Map((catalogo ?? []).map(c => [c.id, c]));

  // Detalle+mostrarDetalle de Resumen comparten la misma lista de "columnas de detalle".
  const necesitaColumnasDetalle = modo === 'detalle' || (modo === 'resumen' && mostrarDetalle);

  function toggleCampo(id: string) {
    setCampos(c => c.includes(id) ? c.filter(x => x !== id) : [...c, id]);
  }

  function toggleAgruparPor(id: string) {
    setAgruparPor(a => a.includes(id) ? a.filter(x => x !== id) : [...a, id]);
  }

  function moverAgruparPor(index: number, direccion: -1 | 1) {
    setAgruparPor(a => {
      const next = [...a];
      const destino = index + direccion;
      if (destino < 0 || destino >= next.length) return a;
      [next[index], next[destino]] = [next[destino], next[index]];
      return next;
    });
  }

  function agregarValor() {
    const primerCampo = catalogo?.[0];
    if (!primerCampo) return;
    setValores(v => [...v, { campo: primerCampo.id, funcion: FUNCIONES_POR_TIPO[primerCampo.tipo][0].value }]);
  }

  function actualizarValor(index: number, patch: Partial<ValorFila>) {
    setValores(v => v.map((fila, i) => {
      if (i !== index) return fila;
      const next = { ...fila, ...patch };
      if (patch.campo) {
        const tipo = camposPorId.get(patch.campo)?.tipo ?? 'texto';
        const funcionesValidas = FUNCIONES_POR_TIPO[tipo].map(f => f.value);
        if (!funcionesValidas.includes(next.funcion)) next.funcion = funcionesValidas[0];
      }
      return next;
    }));
  }

  function quitarValor(index: number) {
    setValores(v => v.filter((_, i) => i !== index));
  }

  function toggleCompany(id: number) {
    setCompanyIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  }

  const missingFields: string[] = [];
  if (!nombre.trim()) missingFields.push('Nombre');
  if (modo === 'detalle' && !campos.length) missingFields.push('Campos');
  if (modo === 'resumen' && !agruparPor.length) missingFields.push('Agrupar por');
  if (modo === 'resumen' && !valores.length) missingFields.push('Valores');
  if (necesitaColumnasDetalle && modo === 'resumen' && mostrarDetalle && !campos.length) missingFields.push('Columnas de detalle');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (missingFields.length > 0) return;
    setSaving(true);
    setFormError(null);
    try {
      const definicion = modo === 'resumen'
        ? { modo: 'resumen' as const, agruparPor, valores, mostrarDetalle, ...(mostrarDetalle ? { campos } : {}) }
        : { modo: 'detalle' as const, campos };

      const payload = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        fuente: 'articulos',
        definicion,
        aplicaATodas,
        companyIds: aplicaATodas ? [] : companyIds,
      };

      if (mode === 'create') {
        await adminFetch('/portal/reportes-recomendados', { method: 'POST', body: JSON.stringify(payload) });
        toast.success('Reporte recomendado creado correctamente');
      } else {
        await adminFetch(`/portal/reportes-recomendados/${initial!.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        toast.success('Reporte recomendado actualizado correctamente');
      }
      router.push('/reportes-recomendados');
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5 max-w-4xl">
      {formError && (
        <Banner variant="error" title="Error al guardar" message={formError} onDismiss={() => setFormError(null)} />
      )}

      <div className="grid grid-cols-1 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input id="nombre" value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Ej. Existencias por Marca" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea
            id="descripcion"
            value={descripcion ?? ''}
            onChange={e => setDescripcion(e.target.value)}
            className="resize-none h-20"
            placeholder="De qué trata este reporte, para qué lo usaría una empresa…"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Fuente</Label>
          <Select value="articulos" disabled>
            <SelectTrigger className="w-full max-w-xs"><SelectValue>{() => 'Artículos'}</SelectValue></SelectTrigger>
            <SelectContent><SelectItem value="articulos">Artículos</SelectItem></SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">Por ahora la única fuente disponible.</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-medium text-sm border-b pb-2">Diseño del reporte</h2>

        <Tabs value={modo} onValueChange={v => setModo(v as 'detalle' | 'resumen')}>
          <TabsList>
            <TabsTrigger value="detalle">Detalle</TabsTrigger>
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen" className="flex flex-col gap-4 pt-2">
            <div className="flex flex-col gap-2">
              <Label>Agrupar por — el orden define cómo se anidan los grupos</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(catalogo ?? []).map(c => (
                  <div key={c.id} className="flex items-center gap-2">
                    <Checkbox id={`grp-${c.id}`} checked={agruparPor.includes(c.id)} onCheckedChange={() => toggleAgruparPor(c.id)} />
                    <Label htmlFor={`grp-${c.id}`} className="font-normal">{c.label}</Label>
                  </div>
                ))}
              </div>
              {agruparPor.length > 0 && (
                <div className="flex flex-col gap-1 rounded-lg border p-2 mt-1">
                  {agruparPor.map((id, i) => (
                    <div key={id} className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground w-5 text-right">{i + 1}.</span>
                      <span className="flex-1">{camposPorId.get(id)?.label ?? id}</span>
                      <Button type="button" variant="ghost" size="icon-sm" disabled={i === 0} onClick={() => moverAgruparPor(i, -1)}>
                        <ArrowUp className="size-3.5" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon-sm" disabled={i === agruparPor.length - 1} onClick={() => moverAgruparPor(i, 1)}>
                        <ArrowDown className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label>Valores</Label>
                <Button type="button" variant="outline" size="sm" onClick={agregarValor}>
                  <Plus className="size-3.5" />Agregar valor
                </Button>
              </div>
              {valores.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin valores — agrega al menos uno (ej. Suma de Existencia).</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {valores.map((v, i) => {
                    const tipo = camposPorId.get(v.campo)?.tipo ?? 'texto';
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <Select value={v.funcion} onValueChange={val => val && actualizarValor(i, { funcion: val })}>
                          <SelectTrigger className="w-40">
                            <SelectValue>{(val: string) => FUNCIONES_POR_TIPO[tipo].find(f => f.value === val)?.label ?? val}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {FUNCIONES_POR_TIPO[tipo].map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <span className="text-xs text-muted-foreground shrink-0">de</span>
                        <Select value={v.campo} onValueChange={val => val && actualizarValor(i, { campo: val })}>
                          <SelectTrigger className="w-56">
                            <SelectValue>{(val: string) => camposPorId.get(val)?.label ?? val}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {(catalogo ?? []).map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="ghost" size="icon-sm" onClick={() => quitarValor(i)} className="text-destructive/70 hover:text-destructive">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 rounded-lg border p-3">
              <Checkbox id="mostrarDetalle" checked={mostrarDetalle} onCheckedChange={(c) => setMostrarDetalle(c === true)} />
              <Label htmlFor="mostrarDetalle" className="flex flex-col gap-0.5 font-normal cursor-pointer">
                <span className="font-medium">Mostrar detalle</span>
                <span className="text-xs text-muted-foreground">Renglón por artículo debajo de cada grupo, además del subtotal.</span>
              </Label>
            </div>
          </TabsContent>
        </Tabs>

        {necesitaColumnasDetalle && (
          <div className="flex flex-col gap-2">
            <Label>{modo === 'resumen' ? 'Columnas de detalle' : 'Campos'}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(catalogo ?? []).map(c => (
                <div key={c.id} className="flex items-center gap-2">
                  <Checkbox id={`campo-${c.id}`} checked={campos.includes(c.id)} onCheckedChange={() => toggleCampo(c.id)} />
                  <Label htmlFor={`campo-${c.id}`} className="font-normal">{c.label}</Label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-medium text-sm border-b pb-2">Empresas</h2>
        <div className="flex items-start gap-2 rounded-lg border p-3">
          <Checkbox id="aplicaATodas" checked={aplicaATodas} onCheckedChange={(c) => setAplicaATodas(c === true)} />
          <Label htmlFor="aplicaATodas" className="flex flex-col gap-0.5 font-normal cursor-pointer">
            <span className="font-medium">Aplica a todas las empresas</span>
            <span className="text-xs text-muted-foreground">Si lo desactivas, elige abajo a cuáles empresas se les asigna.</span>
          </Label>
        </div>
        {!aplicaATodas && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-lg border p-3 max-h-56 overflow-y-auto">
            {(empresas ?? []).map(e => (
              <div key={e.id} className="flex items-center gap-2">
                <Checkbox id={`emp-${e.id}`} checked={companyIds.includes(e.id)} onCheckedChange={() => toggleCompany(e.id)} />
                <Label htmlFor={`emp-${e.id}`} className="font-normal truncate" title={e.name}>{e.name}</Label>
              </div>
            ))}
          </div>
        )}
      </div>

      {missingFields.length > 0 && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Faltan: <strong>{missingFields.join(', ')}</strong>
        </p>
      )}

      <div className="flex items-center gap-3 mt-2">
        <Button type="submit" disabled={saving || missingFields.length > 0}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? 'Guardando…' : mode === 'create' ? 'Crear reporte recomendado' : 'Guardar cambios'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
