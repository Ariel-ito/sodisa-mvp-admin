'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PermisosGrid } from '@/components/accesos/PermisosGrid';
import { PERMISSION_LABEL_MAP } from '@/lib/permissions';
import { adminFetch, ApiError } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

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

interface PropagateInfo {
  roleId: number;
  added: string[];
  removed: string[];
  affectedUserCount: number;
}

export function RolPermsForm({ initial, mode }: Props) {
  const router = useRouter();
  const [name, setName]               = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [permissions, setPermissions] = useState<string[]>(initial?.permissions ?? []);
  const [saving, setSaving]           = useState(false);
  const [propagating, setPropagating] = useState(false);
  const [propagateInfo, setPropagateInfo] = useState<PropagateInfo | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name, description, permissions, type: 'company' };

      if (mode === 'create') {
        await adminFetch('/portal/roles', { method: 'POST', body: JSON.stringify(payload) });
        toast.success('Rol creado correctamente');
        router.push('/roles');
        return;
      }

      // Edit — the response includes delta + affectedUserCount
      const saved = await adminFetch<{
        id: number;
        delta: { added: string[]; removed: string[] };
        affectedUserCount: number;
      }>(`/portal/roles/${initial!.id}`, { method: 'PUT', body: JSON.stringify(payload) });

      toast.success('Rol actualizado correctamente');

      const { added, removed } = saved.delta;
      const hasChanges = added.length > 0 || removed.length > 0;

      if (hasChanges && saved.affectedUserCount > 0) {
        // Show propagation modal before navigating away
        setPropagateInfo({
          roleId:            saved.id,
          added,
          removed,
          affectedUserCount: saved.affectedUserCount,
        });
      } else {
        router.push('/roles');
      }
    } catch (err) {
      toast.error('Error al guardar', { description: err instanceof ApiError ? err.message : 'Error desconocido' });
    } finally {
      setSaving(false);
    }
  }

  async function handlePropagate(confirm: boolean) {
    if (!propagateInfo) return;

    if (confirm) {
      setPropagating(true);
      try {
        const res = await adminFetch<{ affectedUsers: number; message: string }>(
          `/portal/roles/${propagateInfo.roleId}/propagate`,
          {
            method: 'POST',
            body: JSON.stringify({
              added:   propagateInfo.added,
              removed: propagateInfo.removed,
            }),
          },
        );
        toast.success(res.message);
      } catch {
        toast.error('Error al distribuir los cambios');
      } finally {
        setPropagating(false);
      }
    }

    setPropagateInfo(null);
    router.push('/roles');
  }

  const labelFor = (code: string) => PERMISSION_LABEL_MAP[code] ?? code;

  return (
    <>
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

      {/* ── Propagation confirmation modal ──────────────────────────────────── */}
      <Dialog
        open={propagateInfo !== null}
        onOpenChange={open => { if (!open && !propagating) handlePropagate(false); }}
      >
        <DialogContent showCloseButton={false}>
          {propagateInfo && (
            <>
              <DialogHeader>
                <DialogTitle>Distribuir cambios a usuarios</DialogTitle>
                <DialogDescription>
                  <strong className="text-foreground">{propagateInfo.affectedUserCount}</strong> usuario(s)
                  tienen este rol asignado. ¿Quieres aplicar los cambios de permisos a sus
                  permisos directos?
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-3 max-h-56 overflow-y-auto text-sm">
                {propagateInfo.added.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                      Se agregarán
                    </span>
                    {propagateInfo.added.map(p => (
                      <span key={p} className="text-xs text-green-700">
                        ＋ {labelFor(p)}
                      </span>
                    ))}
                  </div>
                )}
                {propagateInfo.removed.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                      Se eliminarán
                    </span>
                    {propagateInfo.removed.map(p => (
                      <span key={p} className="text-xs text-red-700">
                        － {labelFor(p)}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground border-t pt-2">
                  Los permisos agregados manualmente (sin origen de rol) no serán eliminados.
                </p>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => handlePropagate(false)}
                  disabled={propagating}
                >
                  No, solo guardar el rol
                </Button>
                <Button
                  onClick={() => handlePropagate(true)}
                  disabled={propagating}
                >
                  {propagating && <Loader2 className="size-4 animate-spin" />}
                  {propagating ? 'Distribuyendo…' : 'Sí, distribuir cambios'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
