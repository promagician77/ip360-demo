"use client";

import { useState } from "react";
import type { CompatibilityProfile } from "@/lib/assessment/profile";
import type { MatchResult, RuleTrace } from "@/lib/matching/types";
import { RadarChart } from "./RadarChart";
import { ScoreRing, TIER_COLORS, TierBadge } from "./ui";

const BAND_COLOR = {
  excellent: "var(--tier-exceptional)",
  good: "var(--tier-strong)",
  moderate: "var(--tier-promising)",
  low: "var(--tier-ineligible)",
};

const OUTCOME_STYLE: Record<RuleTrace["outcome"], { label: string; color: string }> = {
  pass: { label: "Pass", color: "var(--sage)" },
  fail: { label: "Fail", color: "var(--tier-ineligible)" },
  bonus: { label: "Bonus", color: "var(--sage)" },
  penalty: { label: "Penalty", color: "var(--gold)" },
  neutral: { label: "Neutral", color: "var(--fg-faint)" },
  skipped: { label: "Skipped", color: "var(--fg-faint)" },
};

export function MatchExplanation({ result, a, b }: { result: MatchResult; a: CompatibilityProfile; b: CompatibilityProfile }) {
  const [showTrail, setShowTrail] = useState(false);
  const ex = result.explanation;
  const color = TIER_COLORS[result.tier];

  return (
    <div className="space-y-6">
      {/* Headline */}
      <div className="card overflow-hidden">
        <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
        <div className="grid gap-6 p-6 md:grid-cols-[auto_1fr] md:items-center">
          <ScoreRing score={result.score} tier={result.tier} size={128} stroke={11} label="score" />
          <div>
            <TierBadge tier={result.tier} />
            <h2 className="mt-3 text-2xl font-bold tracking-tight">
              {a.displayName} × {b.displayName}
            </h2>
            <p className="mt-2 leading-relaxed text-fg-muted">{ex.summary}</p>
            {result.eligible && (
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-fg-faint">
                <span>
                  Base <span className="font-semibold text-fg">{result.baseScore}</span>
                </span>
                <span>
                  Modifiers{" "}
                  <span className="font-semibold text-fg">
                    {result.modifierTotal >= 0 ? "+" : ""}
                    {result.modifierTotal}
                  </span>
                </span>
                <span>
                  Distance <span className="font-semibold text-fg">{result.distanceKm} km</span>
                </span>
                <span>
                  Engine <span className="mono font-semibold text-fg">v{result.engineVersion}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Strengths / watch-outs */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <h3 className="flex items-center gap-2 font-semibold">
            <span className="h-2 w-2 rounded-full bg-sage" /> Where you align
          </h3>
          {ex.strengths.length ? (
            <ul className="mt-3 space-y-3 text-sm leading-relaxed text-fg-muted">
              {ex.strengths.map((s, i) => (
                <li key={i} className="rounded-xl bg-sage-soft/60 px-3 py-2">
                  <Strength text={s} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-fg-muted">{result.eligible ? "No dimension scored above 70." : "Strengths are only computed for eligible pairs."}</p>
          )}
        </div>
        <div className="card p-6">
          <h3 className="flex items-center gap-2 font-semibold">
            <span className="h-2 w-2 rounded-full bg-gold" /> {result.eligible ? "Worth talking about" : "Why this isn't a match"}
          </h3>
          {ex.watchouts.length ? (
            <ul className="mt-3 space-y-3 text-sm leading-relaxed text-fg-muted">
              {ex.watchouts.map((s, i) => (
                <li key={i} className="rounded-xl bg-rose-soft/70 px-3 py-2">
                  <Strength text={s} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-fg-muted">Nothing significant flagged.</p>
          )}
        </div>
      </div>

      {/* Dimension breakdown */}
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="card flex flex-col items-center p-6">
          <h3 className="self-start font-semibold">Overlay</h3>
          <RadarChart
            series={[
              { name: a.displayName, scores: a.dimensions, color: "var(--brand)" },
              { name: b.displayName, scores: b.dimensions, color: "var(--sky)" },
            ]}
            size={280}
          />
          <div className="mt-2 flex gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand" /> {a.displayName}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-sky" /> {b.displayName}
            </span>
          </div>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold">Dimension by dimension</h3>
          <div className="mt-4 space-y-4">
            {ex.dimensions.map((d) => (
              <div key={d.key} className="border-b border-line pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold">{d.label}</div>
                  <div className="flex items-center gap-3 text-xs text-fg-faint">
                    <span>
                      {a.displayName} {d.scoreA} · {b.displayName} {d.scoreB}
                    </span>
                    <span>weight {Math.round(d.weight * 100)}%</span>
                    <span className="w-8 text-right text-sm font-bold" style={{ color: BAND_COLOR[d.band] }}>
                      {d.compatibility}
                    </span>
                  </div>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bg-soft">
                  <div className="h-full rounded-full" style={{ width: `${d.compatibility}%`, background: BAND_COLOR[d.band] }} />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{d.narrative}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rule trail */}
      <div className="card p-6">
        <button className="flex w-full items-center justify-between text-left" onClick={() => setShowTrail((s) => !s)}>
          <div>
            <h3 className="font-semibold">Rule trail</h3>
            <p className="text-xs text-fg-muted">Every rule the engine evaluated, in order, with its outcome. This is what makes the result auditable.</p>
          </div>
          <span className="text-sm font-semibold text-brand">{showTrail ? "Hide" : "Show"}</span>
        </button>
        {showTrail && (
          <div className="mt-4 overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-fg-faint">
                  <th className="pb-2 pr-3 font-semibold">Rule</th>
                  <th className="pb-2 pr-3 font-semibold">Stage</th>
                  <th className="pb-2 pr-3 font-semibold">Outcome</th>
                  <th className="pb-2 pr-3 font-semibold">Δ</th>
                  <th className="pb-2 font-semibold">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {ex.ruleTrail.map((r) => {
                  const st = OUTCOME_STYLE[r.outcome];
                  return (
                    <tr key={r.ruleId} className="align-top">
                      <td className="py-2 pr-3 whitespace-nowrap">
                        <span className="mono text-xs text-fg-faint">{r.ruleId}</span> <span className="font-medium">{r.name}</span>
                      </td>
                      <td className="py-2 pr-3 capitalize text-fg-muted">{r.stage}</td>
                      <td className="py-2 pr-3">
                        <span className="pill" style={{ background: `color-mix(in srgb, ${st.color} 14%, transparent)`, color: st.color }}>
                          {st.label}
                        </span>
                      </td>
                      <td className="py-2 pr-3 mono text-xs">{r.delta !== undefined && r.delta !== 0 ? (r.delta > 0 ? `+${r.delta}` : r.delta) : ""}</td>
                      <td className="py-2 text-fg-muted">{r.detail}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Strength({ text }: { text: string }) {
  const idx = text.indexOf(":");
  if (idx === -1) return <>{text}</>;
  return (
    <>
      <span className="font-semibold text-fg">{text.slice(0, idx)}</span>
      {text.slice(idx)}
    </>
  );
}
