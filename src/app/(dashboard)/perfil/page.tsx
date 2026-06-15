'use client';

import { useState, useEffect } from 'react';
import { adminFetch, ApiError } from '@/lib/api';
import { getUser, saveUser } from '@/lib/auth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Banner } from '@/components/ui/Banner';
import { Loader2, User, Lock, ShieldCheck } from 'lucide-react';

interface MeData {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lockedUntil?: string | null;
  failedLoginAttempts?: number;
}

const ROLE_LABEL: Record<string, string> = {
  admin:   'Administrador',
  support: 'Soporte',
};

export default function PerfilPage() {
  const [me, setMe]             = useState<MeData | null>(null);
  const [loading, setLoading]   = useState(true);

  // — Info form
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [savingInfo, setSavingInfo]   = useState(false);
  const [infoError, setInfoError]     = useState<string | null>(null);

  // — Password form
  const [currentPwd, setCurrentPwd]   = useState('');
  const [newPwd, setNewPwd]           = useState('');
  const [confirmPwd, setConfirmPwd]   = useState('');
  const [savingPwd, setSavingPwd]     = useState(false);
  const [pwdError, setPwdError]       = useState<string | null>(null);

  useEffect(() => {
    adminFetch<MeData>('/portal/auth/me')
      .then(data => {
        setMe(data);
        setName(data.name);
        setEmail(data.email);
      })
      .catch(() => toast.error('No se pudo cargar el perfil'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return;
    setSavingInfo(true);
    setInfoError(null);
    try {
      const updated = await adminFetch<{ id: number; name: string; email: string; role: string }>(
        '/portal/auth/me',
        { method: 'PUT', body: JSON.stringify({ name: name.trim(), email: email.trim() }) },
      );
      setMe(prev => prev ? { ...prev, name: updated.name, email: updated.email } : prev);
      // Sincronizar sessionStorage para que el Sidebar refleje el cambio sin recargar
      const stored = getUser();
      if (stored) saveUser({ ...stored, name: updated.name, email: updated.email });
      toast.success('Perfil actualizado correctamente');
    } catch (err) {
      setInfoError(err instanceof ApiError ? err.message : 'Error al guardar');
    } finally {
      setSavingInfo(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      setPwdError('Las contraseñas no coinciden');
      return;
    }
    setSavingPwd(true);
    setPwdError(null);
    try {
      await adminFetch('/portal/auth/me/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      toast.success('Contraseña actualizada correctamente');
    } catch (err) {
      setPwdError(err instanceof ApiError ? err.message : 'Error al cambiar contraseña');
    } finally {
      setSavingPwd(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Cargando perfil…
      </div>
    );
  }

  if (!me) return <p className="text-sm text-destructive">No se pudo cargar el perfil.</p>;

  const initials = me.name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="flex flex-col gap-6 max-w-2xl">

      {/* ── Avatar + rol ─────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="flex size-16 items-center justify-center rounded-full bg-sidebar text-white text-xl font-bold select-none">
          {initials}
        </div>
        <div>
          <p className="text-lg font-semibold">{me.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <ShieldCheck className="size-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {ROLE_LABEL[me.role] ?? me.role}
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-sm text-muted-foreground">
              Miembro desde {new Date(me.createdAt).toLocaleDateString('es-HN', { year: 'numeric', month: 'long' })}
            </span>
          </div>
        </div>
      </div>

      {/* ── Información personal ──────────────────────────────────── */}
      <section className="rounded-xl border bg-card p-6 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <User className="size-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Información personal</h2>
        </div>

        {infoError && (
          <Banner variant="error" title="Error" message={infoError} onDismiss={() => setInfoError(null)} />
        )}

        <form onSubmit={handleSaveInfo} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nombre completo</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              minLength={2}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Button type="submit" disabled={savingInfo}>
              {savingInfo && <Loader2 className="size-4 animate-spin" />}
              {savingInfo ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </section>

      {/* ── Cambiar contraseña ────────────────────────────────────── */}
      <section className="rounded-xl border bg-card p-6 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Lock className="size-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Cambiar contraseña</h2>
        </div>

        {pwdError && (
          <Banner variant="error" title="Error" message={pwdError} onDismiss={() => setPwdError(null)} />
        )}

        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="currentPwd">Contraseña actual</Label>
            <Input
              id="currentPwd"
              type="password"
              value={currentPwd}
              onChange={e => setCurrentPwd(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="newPwd">Nueva contraseña</Label>
            <Input
              id="newPwd"
              type="password"
              value={newPwd}
              onChange={e => setNewPwd(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">Mínimo 8 caracteres</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPwd">Confirmar nueva contraseña</Label>
            <Input
              id="confirmPwd"
              type="password"
              value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div>
            <Button type="submit" disabled={savingPwd}>
              {savingPwd && <Loader2 className="size-4 animate-spin" />}
              {savingPwd ? 'Actualizando…' : 'Cambiar contraseña'}
            </Button>
          </div>
        </form>
      </section>

    </div>
  );
}
