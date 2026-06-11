'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { mutate } from 'swr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RolesSection } from './RolesSection';
import { PermisosGrid } from './PermisosGrid';
import { adminFetch, ApiError } from '@/lib/api';
import { toast } from 'sonner';
import { Banner } from '@/components/ui/Banner';
import { Loader2, Search, KeyRound } from 'lucide-react';
import { BicSearchModal } from './BicSearchModal';

export interface UcaData {
  id?: number;
  companyId: number;
  userId?: number;
  externalId?: string | null;
  supervisorPin?: string | null;
  isActive: boolean;
  user?: { name: string; email: string };
  activeRoles?: string[];
  /** Direct permission codes (from user_company_permissions) */
  activePermissions?: string[];
  /** Which of those direct permissions originated from a role */
  activePermissionsFromRole?: string[];
  grantedUntil?: string | null;
  reason?: string | null;
}

interface Props {
  initial?: UcaData;
  companyId: number;
  mode: 'create' | 'edit';
}

export function AccesoForm({ initial, companyId, mode }: Props) {
  const router = useRouter();

  const [email, setEmail]             = useState(initial?.user?.email ?? '');
  const [name, setName]               = useState(initial?.user?.name ?? '');
  const [password, setPassword]       = useState('');
  const [externalId, setExternalId]   = useState(initial?.externalId ?? '');
  const [supervisorPin, setSupervisorPin] = useState(initial?.supervisorPin ?? '');
  const [isActive, setIsActive]       = useState(initial?.isActive ?? true);
  const [roles, setRoles]             = useState<string[]>(initial?.activeRoles ?? []);
  const [permissions, setPermissions] = useState<string[]>(initial?.activePermissions ?? []);
  const [grantedUntil, setGrantedUntil] = useState(initial?.grantedUntil ?? '');
  const [reason, setReason]           = useState(initial?.reason ?? '');

  /**
   * Codes that are direct permissions AND came from a role (sourceRoleId != null).
   * Loaded from the API — purely for the "ROL" badge in PermisosGrid.
   */
  const [fromRolePermissions] = useState<string[]>(initial?.activePermissionsFromRole ?? []);

  /**
   * Codes that will be added as direct permissions when saved
   * (from roles added in THIS editing session, not yet in the DB).
   * Used for the "ROL +" preview badges in PermisosGrid.
   */
  const [pendingRolePermissions, setPendingRolePermissions] = useState<string[]>([]);

  const [saving, setSaving]           = useState(false);
  const [formError, setFormError]     = useState<string | null>(null);
  const [resettingPwd, setResettingPwd] = useState(false);
  const [bicModalOpen, setBicModalOpen] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (mode === 'create') {
        await adminFetch('/portal/access', {
          method: 'POST',
          body: JSON.stringify({
            companyId,
            email,
            name:     name || undefined,
            password: password || undefined,
            externalId:    externalId    || undefined,
            supervisorPin: supervisorPin || undefined,
            isActive,
          }),
        });
        toast.success('Acceso creado correctamente');
        router.push(`/empresas/${companyId}/usuarios`);
      } else {
        // 1. Basic info
        await adminFetch(`/portal/access/${initial!.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            externalId:    externalId    || null,
            supervisorPin: supervisorPin || null,
            isActive,
          }),
        });
        // 2. Roles — syncRoles auto-copies/removes the role's permissions in the backend
        await adminFetch(`/portal/access/${initial!.id}/roles`, {
          method: 'PUT',
          body: JSON.stringify({ roles }),
        });
        // 3. Direct permission overrides (only the manually managed ones)
        await adminFetch(`/portal/access/${initial!.id}/permissions`, {
          method: 'PUT',
          body: JSON.stringify({
            permissions,
            grantedUntil: grantedUntil || null,
            reason: reason || null,
          }),
        });
        if (password) {
          await adminFetch(`/portal/access/${initial!.id}/reset-password`, {
            method: 'POST',
            body: JSON.stringify({ password }),
          });
        }
        toast.success('Acceso actualizado correctamente');
        await mutate(`/portal/access/${initial!.id}`);
        router.push(`/empresas/${companyId}/usuarios`);
      }
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  }

  function handleBicSelect(codigoBic: string, nombre: string) {
    setExternalId(codigoBic);
    toast.success(`BIC asignado: ${nombre} (${codigoBic})`);
  }

  async function handleResetPassword() {
    if (!password) {
      toast.error('Ingresa una nueva contraseña antes de resetear.');
      return;
    }
    setResettingPwd(true);
    try {
      await adminFetch(`/portal/access/${initial!.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      setPassword('');
      toast.success('Contraseña restablecida correctamente');
    } catch (err) {
      toast.error('Error', { description: err instanceof ApiError ? err.message : 'Error' });
    } finally {
      setResettingPwd(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6 max-w-4xl">
      {formError && (
        <Banner
          variant="error"
          title="Error al guardar"
          message={formError}
          onDismiss={() => setFormError(null)}
        />
      )}
      {/* Información del usuario */}
      <section className="flex flex-col gap-4">
        <h2 className="font-medium text-base border-b pb-2">Información del usuario</h2>
        <div className="grid grid-cols-2 gap-4">
          {mode === 'create' ? (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="usuario@empresa.com"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Se toma del sistema si existe"
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <Label>Nombre</Label>
                <Input value={initial?.user?.name ?? ''} disabled className="bg-muted" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Email</Label>
                <Input value={initial?.user?.email ?? ''} disabled className="bg-muted" />
              </div>
            </>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">
              {mode === 'create' ? 'Contraseña' : 'Nueva contraseña'}{' '}
              <span className="text-muted-foreground">(vacío = sin cambios)</span>
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required={mode === 'create' && !initial?.userId}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="externalId">Código BIC</Label>
            <div className="flex gap-2">
              <Input
                id="externalId"
                value={externalId}
                onChange={e => setExternalId(e.target.value)}
                placeholder="Código en sistema externo"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setBicModalOpen(true)}
                title="Buscar empleado en sistema BIC"
              >
                <Search className="size-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Haz clic en 🔍 para buscar en la base de datos de la empresa.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="supervisorPin">PIN supervisor</Label>
            <Input
              id="supervisorPin"
              value={supervisorPin}
              onChange={e => setSupervisorPin(e.target.value)}
              placeholder="PIN numérico"
            />
          </div>

          <div className="flex items-center gap-2 mt-5">
            <input
              id="isActive"
              type="checkbox"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
              className="size-4"
            />
            <Label htmlFor="isActive">Acceso activo</Label>
          </div>
        </div>
      </section>

      {/* Roles — solo en modo edición */}
      {mode === 'edit' && (
        <section className="flex flex-col gap-4">
          <h2 className="font-medium text-base border-b pb-2">Roles</h2>
          <RolesSection
            selected={roles}
            onChange={setRoles}
            onPendingRolePermissionsChange={setPendingRolePermissions}
          />
        </section>
      )}

      {/* Permisos — solo en modo edición */}
      {mode === 'edit' && (
        <section className="flex flex-col gap-4">
          <h2 className="font-medium text-base border-b pb-2">Permisos por módulo</h2>
          <PermisosGrid
            selected={permissions}
            onChange={setPermissions}
            fromRolePermissions={fromRolePermissions}
            pendingRolePermissions={pendingRolePermissions}
          />
        </section>
      )}

      {/* Configuración de permisos */}
      {mode === 'edit' && (
        <section className="flex flex-col gap-4">
          <h2 className="font-medium text-base border-b pb-2">Configuración de permisos</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="grantedUntil">Válido hasta</Label>
              <Input
                id="grantedUntil"
                type="datetime-local"
                value={grantedUntil}
                onChange={e => setGrantedUntil(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Vacío = permanente</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reason">Razón de asignación</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Motivo o contexto del acceso…"
                className="resize-none h-20"
              />
            </div>
          </div>
        </section>
      )}

      {/* Botones */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? 'Guardando…' : mode === 'create' ? 'Crear acceso' : 'Guardar cambios'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        {mode === 'edit' && (
          <Button
            type="button"
            variant="destructive"
            disabled={resettingPwd || !password}
            onClick={handleResetPassword}
          >
            {resettingPwd ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
            Reset contraseña
          </Button>
        )}
      </div>

      {/* Modal de búsqueda BIC */}
      <BicSearchModal
        companyId={companyId}
        open={bicModalOpen}
        onClose={() => setBicModalOpen(false)}
        onSelect={handleBicSelect}
        currentExternalId={externalId}
      />
    </form>
  );
}
