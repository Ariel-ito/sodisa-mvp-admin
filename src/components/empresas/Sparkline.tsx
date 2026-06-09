'use client';

export interface SparkPoint {
  ok: boolean;
  latencyMs: number | null;
}

interface Props {
  points: SparkPoint[];
  width?: number;
  height?: number;
}

/**
 * Sparkline SVG minimalista para historial de pings.
 * - Línea verde donde hay conexión, proporcional a la latencia (más alto = más rápido).
 * - Punto rojo en la base para cada fallo.
 * - Sin ejes, sin tooltip, sin dependencias externas.
 */
export function Sparkline({ points, width = 72, height = 22 }: Props) {
  if (!points.length) {
    return <span className="text-[10px] text-muted-foreground/40 font-mono">sin datos</span>;
  }

  const padX = 1;
  const padY = 2;
  const innerW = width  - padX * 2;
  const innerH = height - padY * 2;

  const n = points.length;
  const okPoints = points.filter(p => p.ok && p.latencyMs !== null);
  const maxMs    = okPoints.length ? Math.max(...okPoints.map(p => p.latencyMs!)) : 1;

  // Coordenadas de cada punto
  const coords = points.map((p, i) => {
    const x = padX + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    // ok: y inversamente proporcional a latencia (más alto = más rápido)
    // fail: y en la base
    const y = p.ok && p.latencyMs !== null
      ? padY + innerH - (p.latencyMs / maxMs) * innerH * 0.85
      : padY + innerH;
    return { x, y, ok: p.ok };
  });

  // Construir segmentos de línea verde (solo entre puntos ok consecutivos)
  const segments: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < coords.length - 1; i++) {
    if (coords[i].ok && coords[i + 1].ok) {
      segments.push({
        x1: coords[i].x,     y1: coords[i].y,
        x2: coords[i + 1].x, y2: coords[i + 1].y,
      });
    }
  }

  // Puntos de fallo
  const failures = coords.filter(c => !c.ok);

  // Último punto
  const last = coords[coords.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0 overflow-visible"
      aria-hidden
    >
      {/* Líneas verdes */}
      {segments.map((s, i) => (
        <line
          key={i}
          x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
          stroke="#22c55e"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      ))}

      {/* Puntos de fallo — pequeña línea roja vertical en la base */}
      {failures.map((f, i) => (
        <line
          key={i}
          x1={f.x} y1={padY + innerH - 5}
          x2={f.x} y2={padY + innerH}
          stroke="#ef4444"
          strokeWidth={2}
          strokeLinecap="round"
        />
      ))}

      {/* Último punto — dot resaltado */}
      <circle
        cx={last.x}
        cy={last.y}
        r={2}
        fill={last.ok ? '#22c55e' : '#ef4444'}
      />
    </svg>
  );
}
