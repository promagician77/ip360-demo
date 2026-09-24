"use client";

import { DIMENSIONS, DIMENSION_KEYS } from "@/lib/assessment/questions";
import type { DimensionScores } from "@/lib/assessment/profile";

interface Series {
  name: string;
  scores: DimensionScores;
  color: string;
}

/** Six-axis radar chart drawn with plain SVG, so it needs no chart library. */
export function RadarChart({ series, size = 260 }: { series: Series[]; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.34;
  const pad = 44; // horizontal room for axis labels
  const n = DIMENSION_KEYS.length;
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (i: number, v: number) => [cx + Math.cos(angle(i)) * r * (v / 100), cy + Math.sin(angle(i)) * r * (v / 100)];

  const rings = [25, 50, 75, 100];

  return (
    <svg viewBox={`${-pad} 0 ${size + pad * 2} ${size}`} width="100%" style={{ maxWidth: size + pad * 2 }} role="img" aria-label="Compatibility dimensions radar">
      {rings.map((v) => (
        <polygon
          key={v}
          points={DIMENSION_KEYS.map((_, i) => pt(i, v).join(",")).join(" ")}
          fill={v === 100 ? "var(--bg-soft)" : "none"}
          stroke="var(--line)"
          strokeWidth={1}
        />
      ))}
      {DIMENSION_KEYS.map((_, i) => {
        const [x, y] = pt(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line)" strokeWidth={1} />;
      })}
      {series.map((s) => (
        <g key={s.name}>
          <polygon
            points={DIMENSION_KEYS.map((k, i) => pt(i, s.scores[k]).join(",")).join(" ")}
            fill={s.color}
            fillOpacity={0.18}
            stroke={s.color}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {DIMENSION_KEYS.map((k, i) => {
            const [x, y] = pt(i, s.scores[k]);
            return <circle key={k} cx={x} cy={y} r={3.2} fill={s.color} />;
          })}
        </g>
      ))}
      {DIMENSION_KEYS.map((k, i) => {
        const [x, y] = pt(i, 118);
        const a = angle(i);
        const anchor = Math.abs(Math.cos(a)) < 0.2 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
        return (
          <text key={k} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" fontSize={size * 0.042} fontWeight={600} fill="var(--fg-muted)">
            {DIMENSIONS[k].shortLabel}
          </text>
        );
      })}
    </svg>
  );
}
