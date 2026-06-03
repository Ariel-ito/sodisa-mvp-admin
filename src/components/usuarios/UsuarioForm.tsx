'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminFetch, ApiError } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { UserEmpresasSection } from './UserEmpresasSection';

export interface PortalUserData {
  id?: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  password?: string;
}

interface Props {
  initial?: PortalUserData;
  mode: 'create' | 'edit';
}

export function UsuarioForm({ initial, mode }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<PortalUserData>(
    initial ?? { name: '', email: '', role: 'admin', isActive: true, password: '' }
  );
  const [saving, setSaving] = useState(false);

  function set<K extends keyof PortalUserData>(key: K, value: PortalUserData[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Partial<PortalUserData> = { ...form };
      if (mode === 'edit' && !payload.password) delete payload.password;

      if (mode === 'create') {
        await adminFetch('/portal/users', { method: 'POST', body: JSON.stringify(payload) });
        toast.success('Usuario creado correctamente');
      } else {
        await adminFetch(`/portal/users/${initial!.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        toast.success('Usuario actualizado correctamente');
      }
      router.push('/usuarios');
    } catch (err) {
      toast.error('Error al guardar', { description: err instanceof ApiError ? err.message : 'Error desconocido' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5 max-w-2xl">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nombre completo *</Label>
        <Input id="name" value={form.name} onChange={e => set('name', e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Correo electrónico *</Label>
        <Input id="email" type="email" value={form.email} onChange={e => set('email', e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">
          Contraseña {mode === 'edit' && <span className="text-muted-foreground">(vacío = sin cambios)</span>}
        </Label>
        <Input
          id="password"
          type="password"
          value={form.password ?? ''}
          onChange={e => set('password', e.target.value)}
          required={mode === 'create'}
          placeholder={mode === 'edit' ? '••••••••' : ''}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="role">Rol *</Label>
        <select
          id="role"
          value={form.role}
          onChange={e => set('role', e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
        >
          <option value="admin">Administrador</option>
          <option value="support">Soporte</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input
          id="isActive"
          type="checkbox"
          checked={form.isActive}
          onChange={e => set('isActive', e.target.checked)}
          className="size-4"
        />
        <Label htmlFor="isActive">Usuario activo</Label>
      </div>
      <div className="flex items-center gap-3 mt-2">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? 'Guardando…' : mode === 'create' ? 'Crear usuario' : 'Guardar cambios'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>

      {/* Acceso a empresas — solo en modo edición */}
      {mode === 'edit' && initial?.id && (
        <div className="mt-4 border-t pt-6">
          <UserEmpresasSection userId={initial.id} userEmail={initial.email} />
        </div>
      )}
    </form>
  );
}
