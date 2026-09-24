import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getProfileForUser } from "@/lib/server/services/assessment";
import { rankStoredCandidates } from "@/lib/server/services/matching";
import { CHOICE_LABELS, TRAIT_LABELS } from "@/lib/assessment/profile";
import { Avatar, Empty, ScoreRing, TierBadge } from "@/components/ui";

export const metadata = { title: "Matches" };

export default async function MatchesPage() {
  const user = await requireUser();
  const profile = await getProfileForUser(user.id);
  if (!profile) {
    return (
      <Empty
        title="Complete your assessment first"
        body="PairSync™ needs your compatibility profile before it can rank anyone."
        action={
          <Link href="/app/assessment" className="btn btn-primary">
            Start assessment
          </Link>
        }
      />
    );
  }

  const matches = await rankStoredCandidates(profile);
  const eligible = matches.filter((m) => m.eligible);
  const ineligible = matches.filter((m) => !m.eligible);

  return (
    <div className="space-y-8">
      <div>
        <div className="eyebrow mb-2">PairSync™</div>
        <h1 className="text-3xl font-bold tracking-tight">Your matches</h1>
        <p className="mt-1 text-fg-muted">
          {eligible.length} eligible of {matches.length} profiles in the pool. Ranked by compatibility score, with an explanation for each.
        </p>
      </div>

      <div className="grid gap-4">
        {eligible.map((m, i) => (
          <Link key={m.profileB} href={`/app/matches/${m.profileB}`} className="card card-lift flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4 sm:w-64">
              <span className="w-5 text-sm font-bold text-fg-faint">{i + 1}</span>
              <Avatar name={m.candidate.displayName} size={48} />
              <div className="min-w-0">
                <div className="truncate font-semibold">
                  {m.candidate.displayName}, {m.candidate.demographics.age}
                </div>
                <div className="truncate text-xs text-fg-muted">
                  {m.candidate.demographics.city} · {m.distanceKm} km
                </div>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-1.5">
                <span className="pill bg-bg-soft text-fg-muted">{CHOICE_LABELS.intent[m.candidate.intent]}</span>
                <span className="pill bg-bg-soft text-fg-muted">{TRAIT_LABELS.attachmentStyle[m.candidate.traits.attachmentStyle]}</span>
                <span className="pill bg-bg-soft text-fg-muted">{TRAIT_LABELS.socialEnergy[m.candidate.traits.socialEnergy]}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-fg-muted">{m.explanation.summary}</p>
            </div>
            <div className="flex items-center gap-4 sm:flex-col sm:items-end">
              <TierBadge tier={m.tier} size="sm" />
              <ScoreRing score={m.score} tier={m.tier} size={56} stroke={6} />
            </div>
          </Link>
        ))}
        {eligible.length === 0 && <Empty title="No eligible matches yet" body="Nobody in the current pool passes your eligibility rules. Try widening your age range or distance." />}
      </div>

      {ineligible.length > 0 && (
        <details className="card p-5">
          <summary className="cursor-pointer font-semibold">{ineligible.length} profiles filtered out by eligibility rules</summary>
          <div className="mt-4 divide-y divide-line">
            {ineligible.map((m) => (
              <Link key={m.profileB} href={`/app/matches/${m.profileB}`} className="flex items-center gap-4 py-3 hover:opacity-80">
                <Avatar name={m.candidate.displayName} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">
                    {m.candidate.displayName}, {m.candidate.demographics.age}
                  </div>
                  <div className="truncate text-xs text-fg-muted">
                    {m.explanation.ruleTrail
                      .filter((r) => r.outcome === "fail")
                      .map((r) => r.name)
                      .join(" · ")}
                  </div>
                </div>
                <TierBadge tier="ineligible" size="sm" />
              </Link>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
