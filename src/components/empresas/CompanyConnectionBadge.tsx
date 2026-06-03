'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { adminFetch } from '@/lib/api';

interface Props {
  id: number;
  /** Intervalo de auto-refresco en ms. Default: 5 minutos. */
  refreshInterval?: number;
  /** Incrementar para forzar un re-check inmediato desde afuera. */
  refreshKey?: number;
}

type Status = 'checking' | 'ok' | 'error';

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function CompanyConnectionBadge({
  id,
  refreshInterval = 5 * 60_000,
  refreshKey = 0,
}: Props) {
  const [status, setStatus]       = useState<Status>('checking');
  const [ms, setMs]               = useState<number | null>(null);
  const [secondsLeft, setSeconds] = useState<number>(0);

  // Guardamos cuándo será el próximo check sin causar re-renders
  const nextCheckAt = useRef<number>(0);

  const check = useCallback(() => {
    setStatus('checking');
    setSeconds(0);
    nextCheckAt.current = 0; // pausa countdown mientras verifica

    const start = Date.now();
    adminFetch<{ ok: boolean }>(`/portal/companies/${id}/test-connection`, { method: 'POST' })
      .then((r) => {
        setMs(Date.now() - start);
        setStatus(r.ok ? 'ok' : 'error');
        nextCheckAt.current = Date.now() + refreshInterval;
      })
      .catch(() => {
        setStatus('error');
        nextCheckAt.current = Date.now() + refreshInterval;
      });
  }, [id, refreshInterval]);

  // Auto-check al montar y cada `refreshInterval` ms
  useEffect(() => {
    check();
    const timer = setInterval(check, refreshInterval);
    return () => clearInterval(timer);
  }, [check, refreshInterval, refreshKey]);

  // Tick de countdown — corre cada segundo independientemente
  useEffect(() => {
    const ticker = setInterval(() => {
      if (nextCheckAt.current === 0) return; // mientras verifica, no mostrar nada
      const left = Math.max(0, Math.ceil((nextCheckAt.current - Date.now()) / 1000));
      setSeconds(left);
    }, 1_000);
    return () => clearInterval(ticker);
  }, []); // sin deps — el ref siempre tiene el valor actual

  // ── Render ──────────────────────────────────────────────────────────────────

  if (status === 'checking') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        Verificando…
      </span>
    );
  }

  const countdown = secondsLeft > 0
    ? <span className="text-muted-foreground/50 font-mono">· {formatCountdown(secondsLeft)}</span>
    : null;

  if (status === 'ok') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium">
        <Wifi className="size-3 text-green-500" />
        <span className="text-green-600">{ms}ms</span>
        {countdown}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <WifiOff className="size-3 text-red-500" />
      <span className="text-red-500">Sin conexión</span>
      {countdown}
    </span>
  );
}
