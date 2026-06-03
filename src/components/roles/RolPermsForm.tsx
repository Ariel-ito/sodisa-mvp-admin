'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PermisosGrid } from '@/components/accesos/PermisosGrid';
import { adminFetch, ApiError } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export interface RolData {
  id?: number;
  name: string;
  description?: string;
  type?: string;
  isSystem?: boolean;
  permissions?: string[];
}

interface Props {
  initial?: RolData;
  mode: 'create' | 'edit';
}

export function RolPermsForm({ initial, mode }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [permissions, setPermissions] = useState<string[]>(initial?.permissions ?? []);
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name, description, permissions, type: 'company' };
      if (mode === 'create') {
        await adminFetch('/portal/roles', { method: 'POST', body: JSON.stringify(payload) });
        toast.success('Rol creado correctamente');
      } else {
        await adminFetch(`/portal/roles/${initial!.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        toast.success('Rol actualizado correctamente');
      }
      router.push('/roles');
    } catch (err) {
      toast.error('Error al guardar', { description: err instanceof ApiError ? err.message : 'Error desconocido' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5 max-w-4xl">
      <div className="grid grid-cols-1 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nombre interno *</Label>
          <Input
            id="name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            disabled={initial?.isSystem}
            placeholder="vendedor"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="resize-none h-20"
            placeholder="Descripción del rol y sus responsabilidades…"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-medium text-sm border-b pb-2">Permisos del rol</h2>
        <PermisosGrid selected={permissions} onChange={setPermissions} />
      </div>

      <div className="flex items-center gap-3 mt-2">
        <Button type="submit" disabled={saving || initial?.isSystem}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? 'Guardando…' : mode === 'create' ? 'Crear rol' : 'Guardar cambios'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        {initial?.isSystem && (
          <span className="text-xs text-muted-foreground">Este es un rol de sistema y no puede modificarse.</span>
        )}
      </div>
    </form>
  );
}
