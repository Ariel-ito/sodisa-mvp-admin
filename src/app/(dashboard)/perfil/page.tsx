'use client';

import { useState, useEffect } from 'react';
import { adminFetch, ApiError } from '@/lib/api';
import { getUser, saveUser } from '@/lib/auth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Banner } from '@/components/ui/Banner';
import { Loader2, User, Lock, ShieldCheck, Smartphone, X } from 'lucide-react';

interface MeData {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lockedUntil?: string | null;
  failedLoginAttempts?: number;
  totpEnabled?: boolean;
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

  // — 2FA (TOTP)
  const [totpSetup, setTotpSetup]         = useState<{ secret: string; qrCodeDataUrl: string } | null>(null);
  const [totpCode, setTotpCode]           = useState('');
  const [startingTotp, setStartingTotp]   = useState(false);
  const [confirmingTotp, setConfirmingTotp] = useState(false);
  const [totpError, setTotpError]         = useState<string | null>(null);
  const [showDisableTotp, setShowDisableTotp] = useState(false);
  const [disablePwd, setDisablePwd]       = useState('');
  const [disablingTotp, setDisablingTotp] = useState(false);
  const [disableError, setDisableError]   = useState<string | null>(null);

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

  async function handleStartTotp() {
    setStartingTotp(true);
    setTotpError(null);
    try {
      const data = await adminFetch<{ secret: string; qrCodeDataUrl: string }>(
        '/portal/auth/me/totp/setup',
        { method: 'POST' },
      );
      setTotpSetup(data);
      setTotpCode('');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo iniciar la configuración de 2FA');
    } finally {
      setStartingTotp(false);
    }
  }

  async function handleConfirmTotp(e: React.FormEvent) {
    e.preventDefault();
    setConfirmingTotp(true);
    setTotpError(null);
    try {
      await adminFetch('/portal/auth/me/totp/verify-setup', {
        method: 'POST',
        body: JSON.stringify({ code: totpCode }),
      });
      setMe(prev => prev ? { ...prev, totpEnabled: true } : prev);
      setTotpSetup(null);
      setTotpCode('');
      toast.success('2FA activado correctamente');
    } catch (err) {
      setTotpError(err instanceof ApiError ? err.message : 'Código inválido');
    } finally {
      setConfirmingTotp(false);
    }
  }

  function handleCancelTotpSetup() {
    setTotpSetup(null);
    setTotpCode('');
    setTotpError(null);
  }

  async function handleDisableTotp(e: React.FormEvent) {
    e.preventDefault();
    setDisablingTotp(true);
    setDisableError(null);
    try {
      await adminFetch('/portal/auth/me/totp/disable', {
        method: 'POST',
        body: JSON.stringify({ password: disablePwd }),
      });
      setMe(prev => prev ? { ...prev, totpEnabled: false } : prev);
      setShowDisableTotp(false);
      setDisablePwd('');
      toast.success('2FA desactivado correctamente');
    } catch (err) {
      setDisableError(err instanceof ApiError ? err.message : 'Error al desactivar 2FA');
    } finally {
      setDisablingTotp(false);
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

      {/* ── Autenticación de dos factores (2FA) ─────────────────────── */}
      <section className="rounded-xl border bg-card p-6 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Smartphone className="size-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Autenticación de dos factores</h2>
        </div>

        {totpError && (
          <Banner variant="error" title="Error" message={totpError} onDismiss={() => setTotpError(null)} />
        )}

        {/* Estado: 2FA activo */}
        {me.totpEnabled && !showDisableTotp && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full ring-1 ring-green-200">
                <ShieldCheck className="size-3.5" />
                Activado
              </span>
              <p className="text-sm text-muted-foreground">Se te pide un código al iniciar sesión.</p>
            </div>
            <Button type="button" variant="outline" onClick={() => setShowDisableTotp(true)}>
              Desactivar
            </Button>
          </div>
        )}

        {/* Confirmar desactivación con contraseña */}
        {me.totpEnabled && showDisableTotp && (
          <form onSubmit={handleDisableTotp} className="flex flex-col gap-4">
            {disableError && (
              <Banner variant="error" title="Error" message={disableError} onDismiss={() => setDisableError(null)} />
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="disablePwd">Confirma tu contraseña para desactivar 2FA</Label>
              <Input
                id="disablePwd"
                type="password"
                value={disablePwd}
                onChange={e => setDisablePwd(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="destructive" disabled={disablingTotp}>
                {disablingTotp && <Loader2 className="size-4 animate-spin" />}
                {disablingTotp ? 'Desactivando…' : 'Confirmar desactivación'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowDisableTotp(false); setDisablePwd(''); setDisableError(null); }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {/* Estado: 2FA inactivo, sin setup en curso */}
        {!me.totpEnabled && !totpSetup && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Protege tu cuenta con un código de tu app de autenticación (Google Authenticator, Authy, etc.) además de tu contraseña.
            </p>
            <Button type="button" onClick={handleStartTotp} disabled={startingTotp}>
              {startingTotp && <Loader2 className="size-4 animate-spin" />}
              {startingTotp ? 'Generando…' : 'Activar 2FA'}
            </Button>
          </div>
        )}

        {/* Setup en curso: mostrar QR + confirmar código */}
        {!me.totpEnabled && totpSetup && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Escanea este código QR con tu app de autenticación y luego ingresa el código de 6 dígitos que te muestre para confirmar.
            </p>
            <div className="flex flex-col items-center gap-3 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- data URL, no aplica next/image */}
              <img
                src={totpSetup.qrCodeDataUrl}
                alt="Código QR para configurar 2FA"
                className="size-48 rounded-lg border p-2 bg-white"
              />
              <p className="text-xs text-muted-foreground">
                ¿No puedes escanear? Ingresa este código manualmente:
              </p>
              <code className="text-xs font-mono bg-muted px-2 py-1 rounded select-all">{totpSetup.secret}</code>
            </div>

            <form onSubmit={handleConfirmTotp} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="totpConfirmCode">Código de verificación</Label>
                <Input
                  id="totpConfirmCode"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={totpCode}
                  onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  required
                  className="text-center text-lg tracking-[0.3em] max-w-[180px]"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={confirmingTotp || totpCode.length !== 6}>
                  {confirmingTotp && <Loader2 className="size-4 animate-spin" />}
                  {confirmingTotp ? 'Confirmando…' : 'Confirmar y activar'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancelTotpSetup}>
                  <X className="size-4" />
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}
      </section>

    </div>
  );
}
