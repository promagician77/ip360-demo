import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getProfileForUser } from "@/lib/server/services/assessment";
import { ProfileView } from "@/components/ProfileView";
import { Empty } from "@/components/ui";

export const metadata = { title: "My profile" };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const user = await requireUser();
  const profile = await getProfileForUser(user.id);
  const { new: isNew } = await searchParams;

  if (!profile) {
    return (
      <Empty
        title="No profile yet"
        body="Your compatibility profile is generated the moment you complete the PairKnow™ assessment."
        action={
          <Link href="/app/assessment" className="btn btn-primary">
            Start assessment
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {isNew && (
        <div className="fade-up rounded-2xl border border-sage/30 bg-sage-soft px-5 py-4 text-sm">
          <span className="font-semibold text-sage">Profile generated.</span> Your answers were encrypted and scored. Head to{" "}
          <Link href="/app/matches" className="font-semibold text-brand">
            Matches
          </Link>{" "}
          to see who PairSync™ found for you.
        </div>
      )}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="eyebrow eyebrow-ember mb-2">PairKnow™ profile</div>
          <h1 className="display text-4xl">Your compatibility profile</h1>
          <p className="mt-1 text-fg-muted">Schema v{profile.schemaVersion} · generated {profile.meta.generatedAt ? new Date(profile.meta.generatedAt).toLocaleString() : "—"}</p>
        </div>
        <Link href="/app/matches" className="btn btn-primary hidden sm:inline-flex">
          View matches
        </Link>
      </div>
      <ProfileView profile={profile} />
    </div>
  );
}
