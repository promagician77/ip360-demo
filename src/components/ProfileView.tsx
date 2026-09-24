"use client";

import { DIMENSIONS, DIMENSION_KEYS } from "@/lib/assessment/questions";
import { CHOICE_LABELS, TRAIT_LABELS, type CompatibilityProfile } from "@/lib/assessment/profile";
import { RadarChart } from "./RadarChart";
import { Avatar, Bar } from "./ui";

const TRAIT_ORDER: (keyof CompatibilityProfile["traits"])[] = ["attachmentStyle", "socialEnergy", "planningStyle", "conflictStyle", "affectionStyle"];
const TRAIT_TITLES: Record<keyof CompatibilityProfile["traits"], string> = {
  attachmentStyle: "Attachment",
  socialEnergy: "Social energy",
  planningStyle: "Planning",
  conflictStyle: "Conflict",
  affectionStyle: "Affection",
};

export function ProfileView({ profile, compact = false }: { profile: CompatibilityProfile; compact?: boolean }) {
  const w = profile.preferences.weights;
  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar name={profile.displayName} size={64} />
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold tracking-tight">
              {profile.displayName}, {profile.demographics.age}
            </h2>
            <div className="mt-0.5 text-sm text-fg-muted">
              {CHOICE_LABELS.gender[profile.demographics.gender]} · {profile.demographics.city}
            </div>
            {profile.demographics.bio && <p className="mt-2 text-sm italic text-fg-muted">“{profile.demographics.bio}”</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="pill bg-brand-soft text-brand-strong">{CHOICE_LABELS.intent[profile.intent]}</span>
              <span className="pill bg-plum-soft text-plum">{CHOICE_LABELS.children[profile.children]}</span>
              <span className="pill bg-bg-soft text-fg-muted">{CHOICE_LABELS.relocation[profile.relocation]}</span>
              <span className="pill bg-bg-soft text-fg-muted">Faith {profile.faithImportance}/5</span>
              <span className="pill bg-bg-soft text-fg-muted">{CHOICE_LABELS.smoking[profile.smoking]}</span>
              <span className="pill bg-bg-soft text-fg-muted">{CHOICE_LABELS.drinking[profile.drinking]}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="card flex flex-col items-center p-6">
          <h3 className="self-start font-semibold">Dimension map</h3>
          <RadarChart series={[{ name: profile.displayName, scores: profile.dimensions, color: "var(--brand)" }]} size={280} />
        </div>
        <div className="card p-6">
          <h3 className="font-semibold">Dimension scores</h3>
          <div className="mt-4 space-y-4">
            {DIMENSION_KEYS.map((k) => (
              <div key={k}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{DIMENSIONS[k].label}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-fg-faint">{w[k] === 3 ? "Essential" : w[k] === 2 ? "Important" : "Nice to have"}</span>
                    <span className="w-8 text-right font-semibold">{profile.dimensions[k]}</span>
                  </span>
                </div>
                <div className="mt-1.5">
                  <Bar value={profile.dimensions[k]} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="font-semibold">Derived traits</h3>
          <p className="mt-1 text-xs text-fg-muted">Computed from specific items using the documented trait rules.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {TRAIT_ORDER.map((t) => (
              <div key={t} className="rounded-xl bg-bg-soft px-3 py-3">
                <div className="text-[0.68rem] font-semibold uppercase tracking-wider text-fg-faint">{TRAIT_TITLES[t]}</div>
                <div className="mt-0.5 text-sm font-semibold">{(TRAIT_LABELS[t] as Record<string, string>)[profile.traits[t]]}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold">Preferences & dealbreakers</h3>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <dt className="text-fg-muted">Seeking</dt>
            <dd className="font-medium">{profile.preferences.seeking.map((g) => CHOICE_LABELS.gender[g]).join(", ")}</dd>
            <dt className="text-fg-muted">Age range</dt>
            <dd className="font-medium">
              {profile.preferences.ageMin}–{profile.preferences.ageMax}
            </dd>
            <dt className="text-fg-muted">Max distance</dt>
            <dd className="font-medium">{profile.preferences.maxDistanceKm} km</dd>
            <dt className="text-fg-muted">Dealbreakers</dt>
            <dd className="font-medium">{profile.dealbreakers.length ? profile.dealbreakers.map((d) => CHOICE_LABELS.dealbreakers[d]).join(", ") : "None"}</dd>
          </dl>
        </div>
      </div>

      {!compact && (
        <details className="card p-6">
          <summary className="cursor-pointer font-semibold">Raw profile JSON (the PairSync™ contract)</summary>
          <pre className="code mt-4 max-h-96 overflow-auto scrollbar-thin">{JSON.stringify(profile, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}
