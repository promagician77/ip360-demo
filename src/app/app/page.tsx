import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getAssessmentState, getProfileForUser } from "@/lib/server/services/assessment";
import { rankStoredCandidates } from "@/lib/server/services/matching";
import { TOTAL_ITEMS } from "@/lib/assessment/scoring";
import { DIMENSIONS, DIMENSION_KEYS } from "@/lib/assessment/questions";
import { TRAIT_LABELS } from "@/lib/assessment/profile";
import { Avatar, Bar, ScoreRing, Stat, TierBadge } from "@/components/ui";

export const metadata = { title: "Overview" };

export default async function DashboardPage() {
  const user = await requireUser();
  const [state, profile] = await Promise.all([getAssessmentState(user.id), getProfileForUser(user.id)]);
  const matches = profile ? await rankStoredCandidates(profile) : [];
  const eligible = matches.filter((m) => m.eligible);
  const answered = Object.keys(state.answers).length;

  return (
    <div className="space-y-8">
      <div>
        <div className="eyebrow mb-2">Overview</div>
        <h1 className="text-3xl font-bold tracking-tight">Hi {user.displayName.split(" ")[0]}.</h1>
        <p className="mt-1 text-fg-muted">
          {profile ? "Your compatibility profile is ready. Here's how your matches look today." : "Complete the PairKnow™ assessment to unlock your profile and matches."}
        </p>
      </div>

      {!profile ? (
        <div className="card p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-xl font-semibold">{state.status === "in_progress" ? "Pick up where you left off" : "Start the PairKnow™ assessment"}</h2>
              <p className="mt-1 text-sm text-fg-muted">
                {state.status === "in_progress"
                  ? `You've answered ${answered} of ${TOTAL_ITEMS} items. Your progress is saved automatically.`
                  : "About eight minutes. Six dimensions, a few structured questions, and your dealbreakers."}
              </p>
              {state.status === "in_progress" && (
                <div className="mt-4 max-w-sm">
                  <Bar value={(answered / TOTAL_ITEMS) * 100} />
                </div>
              )}
            </div>
            <Link href="/app/assessment" className="btn btn-primary">
              {state.status === "in_progress" ? "Continue" : "Begin assessment"}
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Eligible matches" value={eligible.length} hint={`of ${matches.length} profiles in the pool`} />
            <Stat label="Best match" value={eligible[0] ? `${eligible[0].score}` : "—"} hint={eligible[0] ? `${eligible[0].candidate.displayName} · ${eligible[0].tier}` : "No eligible matches yet"} />
            <Stat label="Profile version" value={<span className="mono text-lg">{profile.schemaVersion}</span>} hint={`Assessment v${profile.meta.assessmentVersion}`} />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Your dimensions</h2>
                <Link href="/app/profile" className="text-sm font-semibold text-brand">
                  Full profile
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {DIMENSION_KEYS.map((k) => (
                  <div key={k} className="grid grid-cols-[120px_1fr_36px] items-center gap-3 text-sm">
                    <span className="text-fg-muted">{DIMENSIONS[k].shortLabel}</span>
                    <Bar value={profile.dimensions[k]} />
                    <span className="text-right font-semibold">{profile.dimensions[k]}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="pill bg-plum-soft text-plum">{TRAIT_LABELS.attachmentStyle[profile.traits.attachmentStyle]}</span>
                <span className="pill bg-sky-soft text-sky">{TRAIT_LABELS.socialEnergy[profile.traits.socialEnergy]}</span>
                <span className="pill bg-sage-soft text-sage">{TRAIT_LABELS.conflictStyle[profile.traits.conflictStyle]}</span>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Top matches</h2>
                <Link href="/app/matches" className="text-sm font-semibold text-brand">
                  See all
                </Link>
              </div>
              <div className="mt-4 divide-y divide-line">
                {eligible.slice(0, 4).map((m) => (
                  <Link key={m.profileB} href={`/app/matches/${m.profileB}`} className="flex items-center gap-4 py-3 transition hover:opacity-80">
                    <Avatar name={m.candidate.displayName} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">
                        {m.candidate.displayName}, {m.candidate.demographics.age}
                      </div>
                      <div className="truncate text-xs text-fg-muted">{m.candidate.demographics.city}</div>
                    </div>
                    <TierBadge tier={m.tier} size="sm" />
                    <ScoreRing score={m.score} tier={m.tier} size={44} stroke={5} />
                  </Link>
                ))}
                {eligible.length === 0 && <p className="py-6 text-center text-sm text-fg-muted">No eligible matches in the pool yet.</p>}
              </div>
            </div>
          </div>

          <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Want to retake the assessment?</h2>
              <p className="text-sm text-fg-muted">Your profile and cached matches are regenerated when you submit again.</p>
            </div>
            <Link href="/app/assessment?retake=1" className="btn btn-secondary">
              Retake assessment
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
