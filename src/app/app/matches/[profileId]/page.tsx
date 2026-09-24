import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { getProfileForUser } from "@/lib/server/services/assessment";
import { matchProfiles } from "@/lib/matching";
import type { CompatibilityProfile } from "@/lib/assessment/profile";
import { MatchExplanation } from "@/components/MatchExplanation";
import { ProfileView } from "@/components/ProfileView";

export const metadata = { title: "Match detail" };

export default async function MatchDetailPage({ params }: { params: Promise<{ profileId: string }> }) {
  const user = await requireUser();
  const { profileId } = await params;
  const seeker = await getProfileForUser(user.id);
  if (!seeker) redirect("/app/assessment");

  const row = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!row) notFound();
  const candidate = JSON.parse(row.data) as CompatibilityProfile;
  const result = matchProfiles(seeker, candidate);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/app/matches" className="text-sm font-semibold text-brand">
          ← All matches
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Why {candidate.displayName}?</h1>
        <p className="mt-1 text-fg-muted">A full PairSync™ explanation: eligibility, dimension scoring, modifiers and the rule trail.</p>
      </div>
      <MatchExplanation result={result} a={seeker} b={candidate} />
      <details className="card p-6">
        <summary className="cursor-pointer font-semibold">{candidate.displayName}&apos;s compatibility profile</summary>
        <div className="mt-6">
          <ProfileView profile={candidate} compact />
        </div>
      </details>
    </div>
  );
}
