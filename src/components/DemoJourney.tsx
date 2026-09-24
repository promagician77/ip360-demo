"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CompatibilityProfile } from "@/lib/assessment/profile";
import { CHOICE_LABELS, TRAIT_LABELS } from "@/lib/assessment/profile";
import type { MatchResult } from "@/lib/matching/types";
import { MatchExplanation } from "./MatchExplanation";
import { ProfileView } from "./ProfileView";
import { Avatar, Empty, ScoreRing, Spinner, TierBadge } from "./ui";

interface DemoProfile {
  slug: string;
  tagline: string;
  profile: CompatibilityProfile;
}

type Mode = "pair" | "rank";

const TRY: [string, string, string][] = [
  ["maya", "daniel", "Runs hot"],
  ["chloe", "sam", "Warm, 235 km apart"],
  ["leo", "sofia", "Mild"],
  ["leo", "jordan", "Cold"],
  ["maya", "ethan", "A dealbreaker"],
  ["maya", "leo", "Intent mismatch"],
  ["grace", "marcus", "Shared faith, far apart"],
];

export function DemoJourney() {
  const [profiles, setProfiles] = useState<DemoProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [a, setA] = useState("maya");
  const [b, setB] = useState("daniel");
  const [mode, setMode] = useState<Mode>("pair");
  const [result, setResult] = useState<MatchResult | null>(null);
  const [ranked, setRanked] = useState<MatchResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [showProfile, setShowProfile] = useState<string | null>(null);

  const runMatch = useCallback((nextA: string, nextB: string, nextMode: Mode) => {
    setBusy(true);
    const body = nextMode === "pair" ? { a: nextA, b: nextB } : { a: nextA };
    fetch("/api/demo/match", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
      .then((r) => r.json())
      .then((d) => {
        if (nextMode === "pair") setResult(d.result ?? null);
        else setRanked(d.results ?? null);
      })
      .finally(() => setBusy(false));
  }, []);

  useEffect(() => {
    // Deep links: /demo?a=maya&b=ethan or /demo?a=maya&mode=rank
    const q = new URLSearchParams(window.location.search);
    const qa = q.get("a");
    const qb = q.get("b");
    const qm: Mode = q.get("mode") === "rank" ? "rank" : "pair";
    fetch("/api/demo/profiles")
      .then((r) => r.json())
      .then((d) => {
        const list: DemoProfile[] = d.profiles ?? [];
        setProfiles(list);
        const has = (s: string | null) => !!s && list.some((p) => p.slug === s);
        const a0 = has(qa) ? (qa as string) : "maya";
        const b0 = has(qb) ? (qb as string) : "daniel";
        setA(a0);
        setB(b0);
        setMode(qm);
        if (list.length) runMatch(a0, b0, qm);
      })
      .finally(() => setLoading(false));
  }, [runMatch]);

  const byId = useMemo(() => new Map(profiles.map((p) => [p.profile.profileId, p.profile])), [profiles]);
  const pa = byId.get(`demo_${a}`);
  const pb = byId.get(`demo_${b}`);

  const select = (nextA: string, nextB: string, nextMode: Mode) => {
    setA(nextA);
    setB(nextB);
    setMode(nextMode);
    runMatch(nextA, nextB, nextMode);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-fg-muted">
        <Spinner /> Loading demo personas…
      </div>
    );
  }
  if (!profiles.length) {
    return <Empty title="No demo data" body="Run `npm run db:seed` to load the twelve demo personas." />;
  }

  return (
    <div className="space-y-8">
      {/* Picker */}
      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="display text-2xl">Pick two people</h2>
            <p className="mt-1 text-sm text-fg-muted">Twelve personas with real assessment answers. Every result is computed live by the engine.</p>
          </div>
          <div className="seg" role="tablist" aria-label="Mode">
            <button role="tab" data-active={mode === "pair"} aria-selected={mode === "pair"} onClick={() => select(a, b, "pair")}>
              Compare pair
            </button>
            <button role="tab" data-active={mode === "rank"} aria-selected={mode === "rank"} onClick={() => select(a, b, "rank")}>
              Rank everyone
            </button>
          </div>
        </div>

        <div className={`mt-5 grid items-stretch gap-3 ${mode === "pair" ? "md:grid-cols-[1fr_auto_1fr]" : ""}`}>
          <PersonaSelect label={mode === "pair" ? "Person A" : "Seeker"} value={a} onChange={(v) => select(v, b, mode)} profiles={profiles} onInspect={() => setShowProfile(a)} />
          {mode === "pair" && (
            <>
              <div className="display-italic hidden place-items-center px-1 text-4xl text-fg-faint md:grid" aria-hidden>
                &amp;
              </div>
              <PersonaSelect label="Person B" value={b} onChange={(v) => select(a, v, mode)} profiles={profiles} onInspect={() => setShowProfile(b)} />
            </>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <span className="eyebrow">Try</span>
          {TRY.map(([x, y, label]) => (
            <button key={label} className={`link ${a === x && b === y && mode === "pair" ? "text-ember" : ""}`} onClick={() => select(x, y, "pair")}>
              {label}
            </button>
          ))}
        </div>
      </section>

      {showProfile && byId.get(`demo_${showProfile}`) && (
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <h3 className="display text-2xl">Compatibility profile</h3>
            <button className="link text-sm" onClick={() => setShowProfile(null)}>
              Close
            </button>
          </div>
          <div className="mt-4">
            <ProfileView profile={byId.get(`demo_${showProfile}`)!} compact />
          </div>
        </section>
      )}

      {busy && (
        <div className="flex items-center gap-2 text-sm text-fg-muted">
          <Spinner /> Running the engine…
        </div>
      )}

      {mode === "pair" && result && pa && pb && <MatchExplanation result={result} a={pa} b={pb} />}

      {mode === "rank" && ranked && pa && (
        <section className="card p-6">
          <h3 className="display text-2xl">Ranked for {pa.displayName}</h3>
          <p className="mt-1 text-xs text-fg-muted">Eligible profiles first, hottest first. Breakers list the rule that failed.</p>
          <div className="mt-4 divide-y divide-line">
            {ranked.map((r, i) => {
              const c = byId.get(r.profileB)!;
              return (
                <button
                  key={r.profileB}
                  className="flex w-full items-center gap-4 py-3.5 text-left transition hover:bg-bg-soft/50"
                  onClick={() => {
                    select(a, r.profileB.replace(/^demo_/, ""), "pair");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <span className="serif w-6 text-lg text-fg-faint figures">{i + 1}</span>
                  <Avatar name={c.displayName} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">
                      {c.displayName}, {c.demographics.age}
                      <span className="ml-2 text-xs font-normal text-fg-faint">
                        {c.demographics.city} · {r.distanceKm} km
                      </span>
                    </div>
                    <div className="truncate text-xs text-fg-muted">
                      {r.eligible
                        ? r.explanation.summary
                        : r.explanation.ruleTrail
                            .filter((t) => t.outcome === "fail")
                            .map((t) => t.detail)
                            .join(" ")}
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex">
                    <TierBadge tier={r.tier} size="sm" />
                  </span>
                  <ScoreRing score={r.score} tier={r.tier} size={48} stroke={5} />
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function PersonaSelect({ label, value, onChange, profiles, onInspect }: { label: string; value: string; onChange: (v: string) => void; profiles: DemoProfile[]; onInspect: () => void }) {
  const p = profiles.find((x) => x.slug === value);
  return (
    <div className="rounded-xl border border-line bg-bg p-4">
      <div className="flex items-center justify-between">
        <span className="eyebrow">{label}</span>
        <button className="link text-xs" onClick={onInspect}>
          View profile
        </button>
      </div>
      <select className="input mt-3" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
        {profiles.map((x) => (
          <option key={x.slug} value={x.slug}>
            {x.profile.displayName}, {x.profile.demographics.age} · {x.profile.demographics.city}
          </option>
        ))}
      </select>
      {p && (
        <div className="mt-4 flex items-start gap-3">
          <Avatar name={p.profile.displayName} size={44} />
          <div className="min-w-0">
            <div className="display text-xl">{p.profile.displayName}</div>
            <div className="text-sm text-fg-muted">{p.tagline}</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="tag">{CHOICE_LABELS.intent[p.profile.intent]}</span>
              <span className="tag">{CHOICE_LABELS.children[p.profile.children]}</span>
              <span className="tag">{TRAIT_LABELS.attachmentStyle[p.profile.traits.attachmentStyle]}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
