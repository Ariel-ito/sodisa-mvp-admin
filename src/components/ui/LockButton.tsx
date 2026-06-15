'use client';

import { useState, useEffect } from 'react';
import { Lock, LockOpen } from 'lucide-react';
import { adminFetch, ApiError } from '@/lib/api';
import { toast } from 'sonner';

interface Props {
  userId: number;
  lockedUntil?: string | null;
  failedLoginAttempts?: number | null;
  onSuccess: () => void;
}

function isManualLock(lockedUntil: string) {
  return new Date(lockedUntil).getFullYear() > 2100;
}

function timeRemaining(lockedUntil: string): string {
  const diff = new Date(lockedUntil).getTime() - Date.now();
  if (diff <= 0) return '';
  const totalMins = Math.ceil(diff / 60_000);
  if (totalMins < 60) return `${totalMins}m`;
  const hrs  = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

export function LockButton({ userId, lockedUntil, failedLoginAttempts, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  // Ticker para actualizar el countdown cada minuto
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!lockedUntil || new Date(lockedUntil) <= new Date()) return;
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const attempts  = failedLoginAttempts ?? 0;
  const isLocked  = !!lockedUntil && new Date(lockedUntil) > new Date();
  const isManual  = isLocked && isManualLock(lockedUntil!);
  const remaining = isLocked && !isManual ? timeRemaining(lockedUntil!) : '';

  // ── Derivar apariencia ──────────────────────────────────────────────────────
  let icon:    React.ReactNode;
  let label:   string;
  let pill:    string | null = null;   // texto junto al icono (solo cuando hay info)
  let colors:  string;

  if (isLocked) {
    icon   = <Lock className="size-3.5 shrink-0" />;
    label  = isManual ? 'Bloqueado manualmente — click para desbloquear' : `Bloqueado hasta las ${new Date(lockedUntil!).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })} — click para desbloquear`;
    pill   = isManual ? 'Manual' : remaining || 'bloqueado';
    colors = 'text-red-600 bg-red-50 ring-1 ring-red-200 hover:bg-red-100';
  } else if (attempts > 0) {
    icon   = <LockOpen className="size-3.5 shrink-0" />;
    label  = `${attempts} intento${attempts !== 1 ? 's' : ''} fallido${attempts !== 1 ? 's' : ''} — click para bloquear`;
    pill   = `${attempts}×`;
    colors = 'text-amber-600 bg-amber-50 ring-1 ring-amber-200 hover:bg-amber-100';
  } else {
    icon   = <LockOpen className="size-3.5 shrink-0" />;
    label  = 'Bloquear usuario';
    pill   = null;
    colors = 'text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted/60';
  }

  async function handleClick() {
    const action  = isLocked ? 'unlock' : 'lock';
    const mensaje = isLocked ? 'desbloquear' : 'bloquear';
    if (!window.confirm(`¿Confirmas ${mensaje} este usuario?`)) return;

    setLoading(true);
    try {
      await adminFetch(`/portal/users/${userId}/${action}`, { method: 'POST' });
      toast.success(isLocked ? 'Usuario desbloqueado' : 'Usuario bloqueado');
      onSuccess();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al cambiar estado');
    } finally {
      setLoading(false);
    }
  }

  // Cuando no hay nada relevante, el botón es solo el ícono (sin pill)
  if (!pill) {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        title={label}
        className={`flex items-center justify-center size-7 rounded-md transition-colors disabled:opacity-40 ${colors}`}
      >
        {icon}
      </button>
    );
  }

  // Con pill: muestra ícono + texto compacto
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title={label}
      className={`flex items-center gap-1 px-2 h-7 rounded-md text-xs font-semibold transition-colors disabled:opacity-40 ${colors}`}
    >
      {icon}
      <span>{loading ? '…' : pill}</span>
    </button>
  );
}
