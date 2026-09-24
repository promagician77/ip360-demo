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
    fetch("/api/demo/profiles")
      .then((r) => r.json())
      .then((d) => {
        const list: DemoProfile[] = d.profiles ?? [];
        setProfiles(list);
        if (list.length) runMatch("maya", "daniel", "pair");
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
      {/* Persona picker */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Pick two people</h2>
            <p className="text-xs text-fg-muted">Twelve seeded personas with real assessment answers. Every result is computed live by the PairSync™ engine.</p>
          </div>
          <div className="inline-flex rounded-full border border-line-strong p-0.5 text-sm">
            <button className={`rounded-full px-3 py-1.5 font-semibold ${mode === "pair" ? "bg-brand text-white" : "text-fg-muted"}`} onClick={() => select(a, b, "pair")}>
              Compare pair
            </button>
            <button className={`rounded-full px-3 py-1.5 font-semibold ${mode === "rank" ? "bg-brand text-white" : "text-fg-muted"}`} onClick={() => select(a, b, "rank")}>
              Rank everyone
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <PersonaSelect label={mode === "pair" ? "Person A" : "Seeker"} value={a} onChange={(v) => select(v, b, mode)} profiles={profiles} onInspect={() => setShowProfile(a)} />
          {mode === "pair" && <PersonaSelect label="Person B" value={b} onChange={(v) => select(a, v, mode)} profiles={profiles} onInspect={() => setShowProfile(b)} />}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-fg-faint self-center">Try:</span>
          {[
            ["maya", "daniel", "Exceptional"],
            ["maya", "ethan", "Dealbreaker"],
            ["maya", "leo", "Intent mismatch"],
            ["priya", "noah", "Both child-free"],
            ["grace", "marcus", "Shared faith, far apart"],
            ["sofia", "jordan", "Secure × anxious"],
          ].map(([x, y, label]) => (
            <button
              key={label}
              className="pill border-line-strong bg-bg-elev text-fg-muted hover:border-brand hover:text-fg"
              onClick={() => select(x, y, "pair")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {showProfile && byId.get(`demo_${showProfile}`) && (
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Compatibility profile</h3>
            <button className="text-sm font-semibold text-brand" onClick={() => setShowProfile(null)}>
              Close
            </button>
          </div>
          <div className="mt-4">
            <ProfileView profile={byId.get(`demo_${showProfile}`)!} compact />
          </div>
        </div>
      )}

      {busy && (
        <div className="flex items-center gap-2 text-sm text-fg-muted">
          <Spinner /> Running the engine…
        </div>
      )}

      {mode === "pair" && result && pa && pb && <MatchExplanation result={result} a={pa} b={pb} />}

      {mode === "rank" && ranked && pa && (
        <div className="card p-6">
          <h3 className="font-semibold">Ranked matches for {pa.displayName}</h3>
          <p className="text-xs text-fg-muted">Eligible profiles first, highest score first. Ineligible profiles list the failed rule.</p>
          <div className="mt-4 divide-y divide-line">
            {ranked.map((r, i) => {
              const c = byId.get(r.profileB)!;
              return (
                <button
                  key={r.profileB}
                  className="flex w-full items-center gap-4 py-3 text-left hover:opacity-80"
                  onClick={() => {
                    select(a, r.profileB.replace(/^demo_/, ""), "pair");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <span className="w-5 text-sm font-bold text-fg-faint">{i + 1}</span>
                  <Avatar name={c.displayName} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">
                      {c.displayName}, {c.demographics.age}{" "}
                      <span className="ml-1 text-xs font-normal text-fg-muted">
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
                  <TierBadge tier={r.tier} size="sm" />
                  <ScoreRing score={r.score} tier={r.tier} size={44} stroke={5} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PersonaSelect({ label, value, onChange, profiles, onInspect }: { label: string; value: string; onChange: (v: string) => void; profiles: DemoProfile[]; onInspect: () => void }) {
  const p = profiles.find((x) => x.slug === value);
  return (
    <div className="rounded-2xl border border-line bg-bg-soft/60 p-4">
      <div className="flex items-center justify-between">
        <span className="label mb-0">{label}</span>
        <button className="text-xs font-semibold text-brand" onClick={onInspect}>
          View profile
        </button>
      </div>
      <select className="input mt-2" value={value} onChange={(e) => onChange(e.target.value)}>
        {profiles.map((x) => (
          <option key={x.slug} value={x.slug}>
            {x.profile.displayName}, {x.profile.demographics.age} · {x.profile.demographics.city}
          </option>
        ))}
      </select>
      {p && (
        <div className="mt-3 flex items-start gap-3">
          <Avatar name={p.profile.displayName} size={40} />
          <div className="min-w-0">
            <div className="text-sm text-fg-muted">{p.tagline}</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span className="pill bg-bg-elev text-fg-muted">{CHOICE_LABELS.intent[p.profile.intent]}</span>
              <span className="pill bg-bg-elev text-fg-muted">{CHOICE_LABELS.children[p.profile.children]}</span>
              <span className="pill bg-bg-elev text-fg-muted">{TRAIT_LABELS.attachmentStyle[p.profile.traits.attachmentStyle]}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
