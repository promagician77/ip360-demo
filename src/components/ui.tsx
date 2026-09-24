"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Tier } from "@/lib/matching/types";
import { TIER_LABELS } from "@/lib/matching/engine";

/* ------------------------------------------------------------------ */
/* Brand                                                                */
/* ------------------------------------------------------------------ */

export function Logo({ className = "", onPhoto = false }: { className?: string; onPhoto?: boolean }) {
  return (
    <Link href="/" className={`inline-flex items-baseline gap-1.5 ${className}`} aria-label="IP360 home">
      <span className="display text-[1.45rem] leading-none tracking-tight" style={{ color: onPhoto ? "#fbf7f1" : "var(--fg)" }}>
        IP<span style={{ color: "var(--ember)" }}>360</span>
      </span>
      <span className="text-[0.6rem] font-semibold" style={{ color: onPhoto ? "rgba(251,247,241,0.6)" : "var(--fg-faint)" }}>
        ™
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Match temperature                                                    */
/* Scores are read like a thermometer: frost (cold) → ember (hot).      */
/* Ineligible pairs are "breakers" and get a fractured, icy treatment.  */
/* ------------------------------------------------------------------ */

export const TIER_COLORS: Record<Tier, string> = {
  exceptional: "var(--tier-exceptional)",
  strong: "var(--tier-strong)",
  promising: "var(--tier-promising)",
  limited: "var(--tier-limited)",
  ineligible: "var(--tier-ineligible)",
};

export type Temperature = "hot" | "warm" | "mild" | "cold" | "breaker";

export const TIER_TEMPERATURE: Record<Tier, Temperature> = {
  exceptional: "hot",
  strong: "warm",
  promising: "mild",
  limited: "cold",
  ineligible: "breaker",
};

export const TEMPERATURE_WORD: Record<Temperature, string> = {
  hot: "Hot",
  warm: "Warm",
  mild: "Mild",
  cold: "Cold",
  breaker: "Breaker",
};

function TempGlyph({ temp, size = 12 }: { temp: Temperature; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (temp) {
    case "hot":
      return (
        <svg {...common} aria-hidden>
          <path d="M12 3c1 3 4 4.5 4 8.5a4 4 0 0 1-8 0c0-1.6.6-2.6 1.4-3.5.3 1.2 1 2 2.1 2.3C11.2 8.6 11.2 5.6 12 3z" />
        </svg>
      );
    case "warm":
      return (
        <svg {...common} aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
        </svg>
      );
    case "mild":
      return (
        <svg {...common} aria-hidden>
          <path d="M4 12h16M4 8h10M4 16h7" />
        </svg>
      );
    case "cold":
      return (
        <svg {...common} aria-hidden>
          <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M12 3l-2 2M12 3l2 2M12 21l-2-2M12 21l2-2" />
        </svg>
      );
    case "breaker":
      return (
        <svg {...common} aria-hidden>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      );
  }
}

export function TierBadge({ tier, size = "md", showTemp = true }: { tier: Tier; size?: "sm" | "md"; showTemp?: boolean }) {
  const color = TIER_COLORS[tier];
  const temp = TIER_TEMPERATURE[tier];
  return (
    <span
      className={`pill ${size === "sm" ? "text-[0.68rem] px-2 py-1" : ""}`}
      style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color, borderColor: `color-mix(in srgb, ${color} 28%, transparent)` }}
    >
      {showTemp && <TempGlyph temp={temp} size={size === "sm" ? 10 : 12} />}
      {TIER_LABELS[tier]}
    </span>
  );
}

/**
 * Temperature gauge: a 240° meter. The track is a lighter step of the fill
 * colour, the fill runs from the cold end to the score, and the data-end
 * carries a marker with a surface ring. Ineligible pairs draw a fractured track.
 */
export function ScoreRing({
  score,
  tier,
  size = 96,
  stroke = 9,
  label,
  degree = false,
}: {
  score: number;
  tier: Tier;
  size?: number;
  stroke?: number;
  label?: string;
  degree?: boolean;
}) {
  const color = TIER_COLORS[tier];
  const broken = tier === "ineligible";
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - stroke) / 2 - 2;
  const sweep = 240;
  const start = 150; // degrees, measured clockwise from 12 o'clock = 0? we use math angles below
  const toXY = (deg: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const arc = (from: number, to: number) => {
    const [x1, y1] = toXY(from);
    const [x2, y2] = toXY(to);
    const large = to - from > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };
  const a0 = start + 60; // 210° → 7 o'clock
  const a1 = a0 + sweep; // 450° → 5 o'clock
  const pct = broken ? 0 : Math.max(0, Math.min(100, score)) / 100;
  const aV = a0 + sweep * pct;
  const [mx, my] = toXY(aV);
  const trackLen = (2 * Math.PI * r * sweep) / 360;

  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={broken ? "Ineligible" : `Score ${score} of 100`} role="img">
        <path
          d={arc(a0, a1)}
          fill="none"
          stroke={broken ? color : `color-mix(in srgb, ${color} 16%, var(--bg-soft))`}
          strokeWidth={stroke}
          strokeLinecap={broken ? "butt" : "round"}
          strokeDasharray={broken ? `${trackLen / 11} ${trackLen / 26}` : undefined}
          strokeOpacity={broken ? 0.45 : 1}
        />
        {!broken && pct > 0 && (
          <path
            d={arc(a0, aV)}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            className={tier === "exceptional" ? "ember-breathe" : undefined}
            style={{ transition: "d 700ms cubic-bezier(.2,.8,.2,1)" }}
          />
        )}
        {!broken && (
          <>
            <circle cx={mx} cy={my} r={stroke * 0.62 + 2} fill="var(--bg-elev)" />
            <circle cx={mx} cy={my} r={stroke * 0.62} fill={color} />
          </>
        )}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center leading-none">
        {broken ? (
          <span className="grid place-items-center" style={{ color }}>
            <TempGlyph temp="breaker" size={size * 0.3} />
          </span>
        ) : (
          <div className="flex flex-col items-center">
            <span className="font-bold tracking-tight" style={{ fontSize: size * 0.3, color: "var(--fg)" }}>
              {score}
              {degree && (
                <span className="align-top" style={{ fontSize: size * 0.14, color, marginLeft: 1 }}>
                  °
                </span>
              )}
            </span>
            {label && <span className="mt-1 text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-fg-faint">{label}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

/** Horizontal reference: where a score sits on the cold → hot scale, with tier thresholds ticked. */
export function TempScale({ score, tier, thresholds = [55, 70, 85] }: { score: number; tier: Tier; thresholds?: number[] }) {
  const broken = tier === "ineligible";
  const color = TIER_COLORS[tier];
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="relative pt-3 pb-5">
      <div className="temp-scale" style={{ opacity: broken ? 0.35 : 1 }} />
      {thresholds.map((t) => (
        <span key={t} className="absolute top-2 h-2 w-px bg-fg-faint/60" style={{ left: `${t}%` }} aria-hidden />
      ))}
      {thresholds.map((t) => (
        <span key={`l${t}`} className="absolute top-6 -translate-x-1/2 text-[0.6rem] text-fg-faint figures" style={{ left: `${t}%` }}>
          {t}
        </span>
      ))}
      {!broken && (
        <span
          className="absolute top-[7px] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-bg-elev"
          style={{ left: `${pct}%`, background: color, boxShadow: "0 1px 4px rgba(0,0,0,.25)", transition: "left 700ms cubic-bezier(.2,.8,.2,1)" }}
          aria-hidden
        />
      )}
      <div className="absolute inset-x-0 top-6 flex justify-between text-[0.6rem] font-semibold uppercase tracking-wider text-fg-faint">
        <span>Cold</span>
        <span>Hot</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Meter (bar)                                                          */
/* ------------------------------------------------------------------ */

export type Band = "excellent" | "good" | "moderate" | "low";

export const BAND_COLOR: Record<Band, string> = {
  excellent: "var(--ember)",
  good: "var(--warm)",
  moderate: "var(--neutral)",
  low: "var(--frost)",
};

export function bandFor(value: number): Band {
  if (value >= 85) return "excellent";
  if (value >= 70) return "good";
  if (value >= 55) return "moderate";
  return "low";
}

/**
 * A meter whose fill carries the temperature and whose track is a lighter
 * step of the same colour. Hot values glow; cold values carry a frost hatch
 * so the state survives greyscale. Ticks at 25/50/75.
 */
export function Bar({
  value,
  color,
  band,
  height = 10,
  ticks = false,
}: {
  value: number;
  color?: string;
  band?: Band;
  height?: number;
  ticks?: boolean;
}) {
  const v = Math.max(0, Math.min(100, value));
  const b = band ?? (color ? undefined : bandFor(v));
  const fill = color ?? (b ? BAND_COLOR[b] : "var(--neutral)");
  return (
    <div
      className="meter"
      style={{ height, ["--meter-track" as string]: `color-mix(in srgb, ${fill} 14%, var(--bg-soft))`, ["--meter-color" as string]: fill }}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v)}
    >
      <div className="meter-fill" data-band={b} style={{ width: `${v}%` }} />
      {ticks && (
        <div className="meter-ticks" aria-hidden>
          <i style={{ left: "25%" }} />
          <i style={{ left: "50%" }} />
          <i style={{ left: "75%" }} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small pieces                                                         */
/* ------------------------------------------------------------------ */

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs font-semibold text-fg-muted">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-fg-faint">{hint}</div>}
    </div>
  );
}

export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="card p-10 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-ember-soft text-ember">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21s-7-4.4-9.3-8.6C.9 9 2.6 5 6.5 5c2 0 3.4 1.1 4.2 2.3C11.9 6.1 13.3 5 15.3 5c3.9 0 5.6 4 3.8 7.4C19 16.6 12 21 12 21z" />
        </svg>
      </div>
      <h3 className="display text-2xl">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Initial avatar. Muted, editorial: one of a small set of paper/ink tones rather than a rainbow. */
const AVATAR_TONES = ["#5b4a6e", "#8a5a3c", "#3f6b5a", "#2c6b9c", "#8a4a4a", "#6b6a3f"];
export function Avatar({ name, size = 40, hue }: { name: string; size?: number; hue?: number }) {
  const idx = hue !== undefined ? hue % AVATAR_TONES.length : [...name].reduce((s, ch) => s + ch.charCodeAt(0), 0) % AVATAR_TONES.length;
  return (
    <div
      className="serif grid shrink-0 place-items-center rounded-full font-medium text-[#fbf7f1]"
      style={{ width: size, height: size, fontSize: size * 0.44, background: AVATAR_TONES[idx] }}
      aria-hidden
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}
