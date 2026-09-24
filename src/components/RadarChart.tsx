"use client";

import { useState } from "react";
import { DIMENSIONS, DIMENSION_KEYS } from "@/lib/assessment/questions";
import type { DimensionScores } from "@/lib/assessment/profile";

interface Series {
  name: string;
  scores: DimensionScores;
  color: string;
}

/**
 * Six-axis radar drawn with plain SVG.
 * Marks: 2px lines, ~10% area wash, 8px markers with a 2px surface ring,
 * hairline grid. Hovering an axis shows every series' value for it.
 */
export function RadarChart({ series, size = 260 }: { series: Series[]; size?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.34;
  const pad = 48;
  const n = DIMENSION_KEYS.length;
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (i: number, v: number): [number, number] => [cx + Math.cos(angle(i)) * r * (v / 100), cy + Math.sin(angle(i)) * r * (v / 100)];
  const rings = [25, 50, 75, 100];

  return (
    <div className="relative w-full" style={{ maxWidth: size + pad * 2 }}>
      <svg viewBox={`${-pad} 0 ${size + pad * 2} ${size}`} width="100%" role="img" aria-label="Compatibility dimensions radar" onMouseLeave={() => setHover(null)}>
        {rings.map((v) => (
          <polygon key={v} points={DIMENSION_KEYS.map((_, i) => pt(i, v).join(",")).join(" ")} fill={v === 100 ? "var(--bg-soft)" : "none"} fillOpacity={0.5} stroke="var(--line)" strokeWidth={1} />
        ))}
        {DIMENSION_KEYS.map((_, i) => {
          const [x, y] = pt(i, 100);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={hover === i ? "var(--fg-faint)" : "var(--line)"} strokeWidth={1} />;
        })}
        {series.map((s) => (
          <g key={s.name}>
            <polygon points={DIMENSION_KEYS.map((k, i) => pt(i, s.scores[k]).join(",")).join(" ")} fill={s.color} fillOpacity={0.1} stroke={s.color} strokeWidth={2} strokeLinejoin="round" />
          </g>
        ))}
        {series.map((s) =>
          DIMENSION_KEYS.map((k, i) => {
            const [x, y] = pt(i, s.scores[k]);
            const active = hover === i;
            return (
              <g key={`${s.name}-${k}`}>
                <circle cx={x} cy={y} r={active ? 6.5 : 5.5} fill="var(--bg-elev)" />
                <circle cx={x} cy={y} r={active ? 4.5 : 3.5} fill={s.color} />
              </g>
            );
          }),
        )}
        {DIMENSION_KEYS.map((k, i) => {
          const [x, y] = pt(i, 120);
          const a = angle(i);
          const anchor = Math.abs(Math.cos(a)) < 0.2 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
          return (
            <text key={k} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" fontSize={size * 0.042} fontWeight={hover === i ? 700 : 600} fill={hover === i ? "var(--fg)" : "var(--fg-muted)"}>
              {DIMENSIONS[k].shortLabel}
            </text>
          );
        })}
        {/* hit wedges: bigger than the marks */}
        {DIMENSION_KEYS.map((_, i) => {
          const a = angle(i);
          const half = Math.PI / n;
          const R = r * 1.35;
          const p1 = [cx + Math.cos(a - half) * R, cy + Math.sin(a - half) * R];
          const p2 = [cx + Math.cos(a + half) * R, cy + Math.sin(a + half) * R];
          return <path key={i} d={`M ${cx} ${cy} L ${p1[0]} ${p1[1]} A ${R} ${R} 0 0 1 ${p2[0]} ${p2[1]} Z`} fill="transparent" onMouseEnter={() => setHover(i)} />;
        })}
      </svg>
      {hover !== null && (
        <div className="card pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2 px-3 py-2 text-xs shadow-card">
          <div className="font-semibold">{DIMENSIONS[DIMENSION_KEYS[hover]].label}</div>
          <div className="mt-1 space-y-0.5">
            {series.map((s) => (
              <div key={s.name} className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-1.5 text-fg-muted">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} /> {s.name}
                </span>
                <span className="figures font-semibold">{s.scores[DIMENSION_KEYS[hover]]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
