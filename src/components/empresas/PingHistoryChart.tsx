'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Activity } from 'lucide-react';
import { swrFetcher } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PingLog {
  id: number;
  ok: boolean;
  latencyMs: number | null;
  createdAt: string;
}

interface ChartPoint {
  time: string;       // HH:MM or DD/MM HH:MM
  timeMs: number;     // for sorting
  latencyMs: number | null;
  status: number;     // 1 = ok, 0 = error (for bar)
  ok: boolean;
}

const RANGE_OPTIONS = [
  { label: '6h',  hours: 6   },
  { label: '24h', hours: 24  },
  { label: '3d',  hours: 72  },
  { label: '7d',  hours: 168 },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso: string, hours: number): string {
  const d = new Date(iso);
  if (hours <= 24) {
    return d.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('es-HN', { day: '2-digit', month: '2-digit' }) +
    ' ' + d.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' });
}

function uptimePct(data: ChartPoint[]): string {
  if (!data.length) return '—';
  const ok = data.filter(d => d.ok).length;
  return ((ok / data.length) * 100).toFixed(1) + '%';
}

function avgLatency(data: ChartPoint[]): string {
  const vals = data.map(d => d.latencyMs).filter((v): v is number => v !== null);
  if (!vals.length) return '—';
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) + ' ms';
}

// ── Custom tooltip ────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number | null; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const statusPayload = payload.find(p => p.name === 'status');
  const latencyPayload = payload.find(p => p.name === 'latencyMs');
  const isOk = (statusPayload?.value ?? 0) === 1;

  return (
    <div className="bg-card border rounded-lg shadow-md px-3 py-2 text-xs space-y-1">
      <p className="font-medium text-muted-foreground">{label}</p>
      <p className={isOk ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
        {isOk ? 'Conexión OK' : 'Sin conexión'}
      </p>
      {isOk && latencyPayload?.value !== null && latencyPayload?.value !== undefined && (
        <p className="text-foreground">{latencyPayload.value} ms</p>
      )}
    </div>
  );
}

// ── Bar color by status ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StatusBar(props: any) {
  const { x, y, width, height, ok } = props;
  return (
    <rect
      x={x} y={y} width={width} height={height}
      fill={ok ? '#22c55e' : '#ef4444'}
      opacity={ok ? 0.25 : 0.5}
      rx={2}
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  companyId: number;
}

export function PingHistoryChart({ companyId }: Props) {
  const [hours, setHours] = useState<number>(24);

  const { data: logs, isLoading } = useSWR<PingLog[]>(
    `/portal/companies/${companyId}/ping-history?hours=${hours}`,
    swrFetcher,
    { refreshInterval: 5 * 60_000 },
  );

  const chartData: ChartPoint[] = (logs ?? []).map(log => ({
    time:      formatTime(log.createdAt, hours),
    timeMs:    new Date(log.createdAt).getTime(),
    latencyMs: log.ok ? log.latencyMs : null,
    status:    log.ok ? 1 : 0,
    ok:        log.ok,
  }));

  const uptime = uptimePct(chartData);
  const avgMs  = avgLatency(chartData);
  const total  = chartData.length;

  return (
    <div className="flex flex-col gap-4">

      {/* Header + range selector */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Historial de conexión</span>
        </div>

        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          {RANGE_OPTIONS.map(opt => (
            <button
              key={opt.hours}
              onClick={() => setHours(opt.hours)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                hours === opt.hours
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Uptime', value: uptime, color: 'text-green-600' },
          { label: 'Latencia avg', value: avgMs, color: 'text-blue-600' },
          { label: 'Muestras', value: isLoading ? '—' : String(total), color: 'text-muted-foreground' },
        ].map(stat => (
          <div key={stat.label} className="rounded-lg border bg-card p-3 text-center">
            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
          Cargando historial…
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
          Sin datos para el rango seleccionado.
        </div>
      ) : (
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                unit=" ms"
                domain={[0, 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconSize={8}
                wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }}
                formatter={(value) => value === 'status' ? 'Estado' : 'Latencia (ms)'}
              />

              {/* Barras de estado: verde=ok, rojo=error */}
              <Bar
                dataKey="status"
                name="status"
                shape={(props: object) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const p = props as any;
                  return <StatusBar {...p} ok={p.ok} />;
                }}
                isAnimationActive={false}
                maxBarSize={8}
              />

              {/* Línea de latencia */}
              <Line
                type="monotone"
                dataKey="latencyMs"
                name="latencyMs"
                stroke="#3b82f6"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, fill: '#3b82f6' }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
