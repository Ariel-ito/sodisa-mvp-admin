'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminFetch, ApiError } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Wifi, RefreshCw } from 'lucide-react';

/** Matches the Company entity: dbUsername / dbDatabase (not dbUser/dbName) */
export interface CompanyData {
  id?: number;
  name: string;
  slug: string;
  emailDomain?: string;
  dbHost: string;
  dbPort: number;
  dbUsername: string;
  dbPassword?: string;
  dbDatabase: string;
  isActive: boolean;
}

interface Props {
  initial?: CompanyData;
  mode: 'create' | 'edit';
}

export function EmpresaForm({ initial, mode }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<CompanyData>(
    initial ?? {
      name: '',
      slug: '',
      emailDomain: '',
      dbHost: 'localhost',
      dbPort: 1433,
      dbUsername: '',
      dbPassword: '',
      dbDatabase: '',
      isActive: true,
    }
  );
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  function set<K extends keyof CompanyData>(key: K, value: CompanyData[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (mode === 'edit' && !payload.dbPassword) {
        delete payload.dbPassword;
      }

      if (mode === 'create') {
        await adminFetch('/portal/companies', { method: 'POST', body: JSON.stringify(payload) });
        toast.success('Empresa creada correctamente');
      } else {
        await adminFetch(`/portal/companies/${initial!.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        toast.success('Empresa actualizada correctamente');
      }
      router.push('/empresas');
    } catch (err) {
      toast.error('Error al guardar', { description: err instanceof ApiError ? err.message : 'Error desconocido' });
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await adminFetch<{ success: boolean; message: string }>(
        `/portal/companies/${initial!.id}/test-connection`,
        { method: 'POST' }
      );
      setTestResult(result);
    } catch (err) {
      setTestResult({ success: false, message: err instanceof ApiError ? err.message : 'Error desconocido' });
    } finally {
      setTesting(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await adminFetch<{ created: number; linked: number; skipped: number }>(
        `/portal/companies/${initial!.id}/sync-users`,
        { method: 'POST' }
      );
      setSyncResult(`Creados: ${result.created} | Vinculados: ${result.linked} | Omitidos: ${result.skipped}`);
      toast.success('Sincronización completada');
    } catch (err) {
      toast.error('Error en sincronización', { description: err instanceof ApiError ? err.message : 'Error desconocido' });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6 max-w-2xl">
      {/* Información general */}
      <section className="flex flex-col gap-4">
        <h2 className="font-medium text-base border-b pb-2">Información general</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nombre *</Label>
            <Input id="name" value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="auto-generado si vacío" />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="emailDomain">Dominio de email</Label>
            <Input
              id="emailDomain"
              value={form.emailDomain ?? ''}
              onChange={e => set('emailDomain', e.target.value)}
              placeholder="empresa.com (para auto-generar emails en sync)"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="isActive"
            type="checkbox"
            checked={form.isActive}
            onChange={e => set('isActive', e.target.checked)}
            className="size-4"
          />
          <Label htmlFor="isActive">Empresa activa</Label>
        </div>
      </section>

      {/* Conexión a base de datos */}
      <section className="flex flex-col gap-4">
        <h2 className="font-medium text-base border-b pb-2">Conexión a base de datos (SQL Server)</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dbHost">Host *</Label>
            <Input id="dbHost" value={form.dbHost} onChange={e => set('dbHost', e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dbPort">Puerto *</Label>
            <Input id="dbPort" type="number" value={form.dbPort} onChange={e => set('dbPort', Number(e.target.value))} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dbDatabase">Base de datos *</Label>
            <Input id="dbDatabase" value={form.dbDatabase} onChange={e => set('dbDatabase', e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dbUsername">Usuario *</Label>
            <Input id="dbUsername" value={form.dbUsername} onChange={e => set('dbUsername', e.target.value)} required />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="dbPassword">
              Contraseña {mode === 'edit' && <span className="text-muted-foreground text-xs">(vacío = sin cambios)</span>}
            </Label>
            <Input
              id="dbPassword"
              type="password"
              value={form.dbPassword ?? ''}
              onChange={e => set('dbPassword', e.target.value)}
              placeholder={mode === 'edit' ? '••••••••' : ''}
              required={mode === 'create'}
            />
          </div>
        </div>
      </section>

      {/* Acciones */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? 'Guardando…' : mode === 'create' ? 'Crear empresa' : 'Guardar cambios'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>

        {mode === 'edit' && (
          <>
            <Button type="button" variant="outline" disabled={testing} onClick={handleTestConnection}>
              {testing ? <Loader2 className="size-4 animate-spin" /> : <Wifi className="size-4" />}
              Test conexión
            </Button>
            <Button type="button" variant="outline" disabled={syncing} onClick={handleSync}>
              {syncing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              Sync usuarios
            </Button>
          </>
        )}
      </div>

      {testResult && (
        <div className={`rounded-md px-3 py-2 text-sm ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-destructive/10 text-destructive'}`}>
          {testResult.success ? '✅ ' : '❌ '}{testResult.message}
        </div>
      )}
      {syncResult && (
        <div className="rounded-md bg-blue-50 text-blue-700 px-3 py-2 text-sm">
          Sincronización completada — {syncResult}
        </div>
      )}
    </form>
  );
}
