"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Tier } from "@/lib/matching/types";
import { TIER_LABELS } from "@/lib/matching/engine";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <span className="relative grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-brand to-coral text-white shadow-soft">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="12" r="5" />
          <circle cx="16" cy="12" r="5" />
        </svg>
      </span>
      <span className="text-[1.05rem]">
        IP<span className="text-brand">360</span>
        <span className="ml-1 text-xs font-medium text-fg-faint align-top">™</span>
      </span>
    </Link>
  );
}

export const TIER_COLORS: Record<Tier, string> = {
  exceptional: "var(--tier-exceptional)",
  strong: "var(--tier-strong)",
  promising: "var(--tier-promising)",
  limited: "var(--tier-limited)",
  ineligible: "var(--tier-ineligible)",
};

export function TierBadge({ tier, size = "md" }: { tier: Tier; size?: "sm" | "md" }) {
  const color = TIER_COLORS[tier];
  return (
    <span
      className={`pill ${size === "sm" ? "text-[0.68rem] px-2 py-1" : ""}`}
      style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color, borderColor: `color-mix(in srgb, ${color} 30%, transparent)` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {TIER_LABELS[tier]}
    </span>
  );
}

export function ScoreRing({ score, tier, size = 88, stroke = 8, label }: { score: number; tier: Tier; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = tier === "ineligible" ? 0 : score / 100;
  const color = TIER_COLORS[tier];
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--line)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 700ms cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center leading-none">
        {tier === "ineligible" ? (
          <span className="text-lg font-bold" style={{ color }}>
            ✕
          </span>
        ) : (
          <>
            <span className="font-bold tracking-tight" style={{ fontSize: size * 0.3, color: "var(--fg)" }}>
              {score}
            </span>
            {label && <span className="mt-0.5 text-[0.6rem] uppercase tracking-wider text-fg-faint">{label}</span>}
          </>
        )}
      </div>
    </div>
  );
}

export function Bar({ value, color = "var(--brand)", height = 8 }: { value: number; color?: string; height?: number }) {
  return (
    <div className="w-full overflow-hidden rounded-full bg-bg-soft" style={{ height }}>
      <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color, transition: "width 600ms ease" }} />
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-fg-faint">{label}</div>
      <div className="mt-1 text-2xl font-bold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-fg-muted">{hint}</div>}
    </div>
  );
}

export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="card p-10 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21s-7-4.4-9.3-8.6C.9 9 2.6 5 6.5 5c2 0 3.4 1.1 4.2 2.3C11.9 6.1 13.3 5 15.3 5c3.9 0 5.6 4 3.8 7.4C19 16.6 12 21 12 21z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-fg-muted">{body}</p>
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

export function Avatar({ name, size = 40, hue }: { name: string; size?: number; hue?: number }) {
  const h = hue ?? [...name].reduce((s, ch) => s + ch.charCodeAt(0), 0) % 360;
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.4, background: `linear-gradient(135deg, hsl(${h} 55% 55%), hsl(${(h + 40) % 360} 60% 45%))` }}
      aria-hidden
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}
