'use client';

import { RotateCw, Wifi, WifiOff, Minus } from 'lucide-react';

interface PingCompany {
  lastPingAt: string | null;
  lastPingOk: boolean | null;
  lastPingMs: number | null;
}

function timeAgo(isoDate: string): string {
  const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (diff < 60)   return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} d`;
}

export function PingStatus({ company, refreshing }: { company: PingCompany; refreshing: boolean }) {
  if (refreshing) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <RotateCw className="size-3 animate-spin" />
        Verificando…
      </span>
    );
  }

  if (company.lastPingAt === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/50">
        <Minus className="size-3" />Sin datos
      </span>
    );
  }

  const ago = timeAgo(company.lastPingAt);

  if (company.lastPingOk) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium">
        <Wifi className="size-3 text-green-500" />
        <span className="text-green-600">{company.lastPingMs}ms</span>
        <span className="text-muted-foreground/50">· {ago}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <WifiOff className="size-3 text-red-500" />
      <span className="text-red-500">Sin conexión</span>
      <span className="text-muted-foreground/50">· {ago}</span>
    </span>
  );
}
