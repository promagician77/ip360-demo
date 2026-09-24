"use client";

import { useState } from "react";
import type { CompatibilityProfile } from "@/lib/assessment/profile";
import type { MatchResult, RuleTrace } from "@/lib/matching/types";
import { RadarChart } from "./RadarChart";
import { BAND_COLOR, Bar, ScoreRing, TEMPERATURE_WORD, TIER_COLORS, TIER_TEMPERATURE, TempScale, TierBadge } from "./ui";

const OUTCOME_STYLE: Record<RuleTrace["outcome"], { label: string; color: string }> = {
  pass: { label: "Pass", color: "var(--moss)" },
  fail: { label: "Fail", color: "var(--ice)" },
  bonus: { label: "Bonus", color: "var(--ember)" },
  penalty: { label: "Penalty", color: "var(--warm)" },
  neutral: { label: "Neutral", color: "var(--fg-faint)" },
  skipped: { label: "Skipped", color: "var(--fg-faint)" },
};

const TEMP_COPY = {
  hot: "Runs hot. Nearly every dimension lines up.",
  warm: "Warm. Solid ground with a few things to talk through.",
  mild: "Mild. Real overlap, real differences.",
  cold: "Cold. Eligible, but the profiles pull in different directions.",
  breaker: "Breaker. A hard rule failed, so no score is computed.",
};

export function MatchExplanation({ result, a, b }: { result: MatchResult; a: CompatibilityProfile; b: CompatibilityProfile }) {
  const [showTrail, setShowTrail] = useState(false);
  const ex = result.explanation;
  const color = TIER_COLORS[result.tier];
  const temp = TIER_TEMPERATURE[result.tier];
  const bgTemp = temp === "hot" ? "hot" : temp === "cold" ? "cold" : temp === "breaker" ? "breaker" : "none";

  return (
    <div className="space-y-6">
      {/* Headline */}
      <section className={`card temp-bg ${bgTemp === "breaker" ? "crack" : ""}`} data-temp={bgTemp}>
        <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[auto_1fr] md:items-center">
          <ScoreRing score={result.score} tier={result.tier} size={168} stroke={13} label={result.eligible ? "match temp" : undefined} degree />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <TierBadge tier={result.tier} />
              <span className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color }}>
                {TEMPERATURE_WORD[temp]}
              </span>
            </div>
            <h2 className="display mt-3 text-4xl sm:text-5xl">
              {a.displayName} <span className="display-italic text-fg-faint">&amp;</span> {b.displayName}
            </h2>
            <p className="mt-3 max-w-2xl text-[1.02rem] leading-relaxed text-fg-muted">{ex.summary}</p>
            <p className="mt-1 text-sm text-fg-faint">{TEMP_COPY[temp]}</p>
            <div className="mt-5 max-w-md">
              <TempScale score={result.score} tier={result.tier} />
            </div>
            {result.eligible && (
              <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-fg-faint">
                <div>
                  <dt className="inline">Base </dt>
                  <dd className="inline font-semibold text-fg figures">{result.baseScore}</dd>
                </div>
                <div>
                  <dt className="inline">Modifiers </dt>
                  <dd className="inline font-semibold text-fg figures">
                    {result.modifierTotal >= 0 ? "+" : ""}
                    {result.modifierTotal}
                  </dd>
                </div>
                <div>
                  <dt className="inline">Distance </dt>
                  <dd className="inline font-semibold text-fg figures">{result.distanceKm} km</dd>
                </div>
                <div>
                  <dt className="inline">Engine </dt>
                  <dd className="mono inline font-semibold text-fg">v{result.engineVersion}</dd>
                </div>
              </dl>
            )}
          </div>
        </div>
      </section>

      {/* Strengths / watch-outs */}
      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-6">
          <h3 className="display text-2xl">Where they align</h3>
          {ex.strengths.length ? (
            <ul className="mt-4 divide-y divide-line text-sm leading-relaxed text-fg-muted">
              {ex.strengths.map((s, i) => (
                <li key={i} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ember" />
                  <span>
                    <Strength text={s} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-fg-muted">{result.eligible ? "No dimension scored above 70." : "Strengths are only computed for eligible pairs."}</p>
          )}
        </section>
        <section className="card p-6">
          <h3 className="display text-2xl">{result.eligible ? "Worth talking about" : "Why this isn't a match"}</h3>
          {ex.watchouts.length ? (
            <ul className="mt-4 divide-y divide-line text-sm leading-relaxed text-fg-muted">
              {ex.watchouts.map((s, i) => (
                <li key={i} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${result.eligible ? "bg-warm" : "bg-ice"}`} />
                  <span>
                    <Strength text={s} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-fg-muted">Nothing significant flagged.</p>
          )}
        </section>
      </div>

      {/* Dimension breakdown */}
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <section className="card flex flex-col items-center p-6">
          <h3 className="display self-start text-2xl">Overlay</h3>
          <p className="mb-2 self-start text-xs text-fg-faint">Hover an axis to compare.</p>
          <RadarChart
            series={[
              { name: a.displayName, scores: a.dimensions, color: "var(--ember)" },
              { name: b.displayName, scores: b.dimensions, color: "var(--frost)" },
            ]}
            size={280}
          />
          <div className="mt-2 flex gap-5 text-xs text-fg-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-ember" /> {a.displayName}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-frost" /> {b.displayName}
            </span>
          </div>
        </section>
        <section className="card p-6">
          <h3 className="display text-2xl">Dimension by dimension</h3>
          <div className="mt-5 space-y-5">
            {ex.dimensions.map((d) => (
              <div key={d.key} className="border-b border-line pb-5 last:border-0 last:pb-0">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="font-semibold">{d.label}</div>
                  <div className="flex items-baseline gap-3 text-xs text-fg-faint">
                    <span className="figures">
                      {a.displayName} {d.scoreA} · {b.displayName} {d.scoreB}
                    </span>
                    <span className="figures">weight {Math.round(d.weight * 100)}%</span>
                    <span className="w-8 text-right text-base font-bold figures" style={{ color: BAND_COLOR[d.band] }}>
                      {d.compatibility}
                    </span>
                  </div>
                </div>
                <div className="mt-2.5">
                  <Bar value={d.compatibility} band={d.band} />
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-fg-muted">{d.narrative}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Rule trail */}
      <section className="card p-6">
        <button className="flex w-full items-center justify-between text-left" onClick={() => setShowTrail((s) => !s)} aria-expanded={showTrail}>
          <div>
            <h3 className="display text-2xl">Rule trail</h3>
            <p className="mt-1 text-xs text-fg-muted">Every rule the engine evaluated, in order, with its outcome. This is what makes the result auditable.</p>
          </div>
          <span className="link text-sm">{showTrail ? "Hide" : "Show"}</span>
        </button>
        {showTrail && (
          <div className="mt-5 overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[0.68rem] uppercase tracking-wider text-fg-faint">
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
                      <td className="whitespace-nowrap py-2.5 pr-3">
                        <span className="mono text-xs text-fg-faint">{r.ruleId}</span> <span className="font-medium">{r.name}</span>
                      </td>
                      <td className="py-2.5 pr-3 capitalize text-fg-muted">{r.stage}</td>
                      <td className="py-2.5 pr-3">
                        <span className="pill" style={{ background: `color-mix(in srgb, ${st.color} 12%, transparent)`, color: st.color }}>
                          {st.label}
                        </span>
                      </td>
                      <td className="mono py-2.5 pr-3 text-xs figures">{r.delta !== undefined && r.delta !== 0 ? (r.delta > 0 ? `+${r.delta}` : r.delta) : ""}</td>
                      <td className="py-2.5 text-fg-muted">{r.detail}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
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
