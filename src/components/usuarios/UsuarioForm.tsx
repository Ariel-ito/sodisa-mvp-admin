'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminFetch, ApiError } from '@/lib/api';
import { toast } from 'sonner';
import { Banner } from '@/components/ui/Banner';
import { Loader2, Lock, LockOpen, ShieldCheck, ShieldOff } from 'lucide-react';
import { SupportCompanyScopeSection } from './SupportCompanyScopeSection';

export interface PortalUserData {
  id?: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  password?: string;
  lockedUntil?: string | null;
  failedLoginAttempts?: number;
  totpEnabled?: boolean;
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
  const [saving, setSaving]       = useState(false);
  const [locking, setLocking]     = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [resettingTotp, setResettingTotp] = useState(false);
  const [totpEnabled, setTotpEnabled]     = useState(initial?.totpEnabled ?? false);

  const isLocked = initial?.lockedUntil ? new Date(initial.lockedUntil) > new Date() : false;

  async function handleResetTotp() {
    if (!initial?.id) return;
    if (!window.confirm(`¿Resetear el 2FA de ${initial.name}? Va a tener que configurarlo de nuevo la próxima vez que inicie sesión.`)) return;
    setResettingTotp(true);
    try {
      await adminFetch(`/portal/users/${initial.id}/totp/reset`, { method: 'POST' });
      setTotpEnabled(false);
      toast.success('2FA reseteado correctamente');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al resetear 2FA');
    } finally {
      setResettingTotp(false);
    }
  }

  async function handleToggleLock() {
    if (!initial?.id) return;
    const action = isLocked ? 'unlock' : 'lock';
    const label  = isLocked ? 'desbloquear' : 'bloquear';
    if (!window.confirm(`¿Confirmas ${label} a ${initial.name}?`)) return;
    setLocking(true);
    try {
      await adminFetch(`/portal/users/${initial.id}/${action}`, { method: 'POST' });
      toast.success(isLocked ? 'Usuario desbloqueado' : 'Usuario bloqueado');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al cambiar estado');
    } finally {
      setLocking(false);
    }
  }

  function set<K extends keyof PortalUserData>(key: K, value: PortalUserData[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
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
      setFormError(err instanceof ApiError ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5 max-w-2xl">
      {formError && (
        <Banner
          variant="error"
          title="Error al guardar"
          message={formError}
          onDismiss={() => setFormError(null)}
        />
      )}
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
          <option value="qa">QA</option>
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
      <div className="flex items-center gap-3 mt-2 flex-wrap">
        <Button type="submit" disabled={saving || locking}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? 'Guardando…' : mode === 'create' ? 'Crear usuario' : 'Guardar cambios'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving || locking}>
          Cancelar
        </Button>

        {mode === 'edit' && (
          <Button
            type="button"
            variant={isLocked ? 'outline' : 'destructive'}
            onClick={handleToggleLock}
            disabled={locking || saving}
            className="ml-auto"
          >
            {locking
              ? <Loader2 className="size-4 animate-spin" />
              : isLocked
                ? <LockOpen className="size-4" />
                : <Lock className="size-4" />
            }
            {locking ? 'Procesando…' : isLocked ? 'Desbloquear usuario' : 'Bloquear usuario'}
          </Button>
        )}
      </div>

      {mode === 'edit' && isLocked && (
        <p className="text-sm text-destructive flex items-center gap-1.5">
          <Lock className="size-3.5" />
          {initial?.lockedUntil && new Date(initial.lockedUntil).getFullYear() > 2100
            ? 'Bloqueado manualmente por un administrador.'
            : `Bloqueado automáticamente hasta las ${new Date(initial!.lockedUntil!).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })}.`
          }
          {(initial?.failedLoginAttempts ?? 0) > 0 && ` (${initial!.failedLoginAttempts} intentos fallidos)`}
        </p>
      )}

      {mode === 'edit' && initial?.id && (
        <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
          <div className="flex items-center gap-2 text-sm">
            {totpEnabled ? (
              <>
                <ShieldCheck className="size-4 text-green-600" />
                <span>2FA activado</span>
              </>
            ) : (
              <>
                <ShieldOff className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">2FA no configurado</span>
              </>
            )}
          </div>
          {totpEnabled && (
            <Button type="button" variant="outline" size="sm" onClick={handleResetTotp} disabled={resettingTotp}>
              {resettingTotp && <Loader2 className="size-3.5 animate-spin" />}
              {resettingTotp ? 'Reseteando…' : 'Resetear 2FA'}
            </Button>
          )}
        </div>
      )}

      {/* Empresas asignadas manualmente — Soporte (única fuente de acceso) y QA
          (adicional a su acceso automático a empresas demo) — modo edición.
          Nota: esta pantalla solo edita usuarios STAFF (admin/support/qa, ver
          <select> de Rol arriba) -- nunca un usuario CLIENT. Por eso ya no se
          renderiza acá "Acceso a empresas" (UserCompanyAccess): esa tabla da
          una identidad real de empleado de empresa, pero para un usuario
          staff el flujo de seleccionar-empresa SIEMPRE fuerza impersonar
          (`isSodisaStaff` en mvp_app), así que esa identidad nunca se llega a
          usar -- quedaba como una segunda sección "asignar empresa" que
          duplicaba visualmente esta de acá sin aportar nada funcional. */}
      {mode === 'edit' && initial?.id && (initial.role === 'support' || initial.role === 'qa') && (
        <div className="mt-4 border-t pt-6">
          <SupportCompanyScopeSection userId={initial.id} role={initial.role === 'qa' ? 'qa' : 'support'} />
        </div>
      )}
    </form>
  );
}
