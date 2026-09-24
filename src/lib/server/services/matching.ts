import { prisma } from "@/lib/db/client";
import type { CompatibilityProfile } from "@/lib/assessment/profile";
import { ENGINE_VERSION, matchProfiles, type MatchResult } from "@/lib/matching";
import { HttpError } from "../http";

export interface RankedMatch extends MatchResult {
  candidate: Pick<CompatibilityProfile, "profileId" | "displayName" | "demographics" | "traits" | "intent" | "children">;
}

/**
 * Invariant: `Profile.id === CompatibilityProfile.profileId` for every stored profile.
 * Both the seed and `submitAssessment` guarantee it; MatchResult foreign keys depend on it.
 *
 * Ranks every stored profile against the seeker. Results are cached per
 * (A, B, engineVersion); the cache is invalidated when either profile is regenerated
 * because a regenerated profile gets new MatchResult rows via cascade delete.
 */
export async function rankStoredCandidates(seeker: CompatibilityProfile): Promise<RankedMatch[]> {
  const candidates = await prisma.profile.findMany({ where: { id: { not: seeker.profileId } } });
  const cached = await prisma.matchResult.findMany({
    where: { profileAId: seeker.profileId, engineVersion: ENGINE_VERSION },
  });
  const cacheByB = new Map(cached.map((c) => [c.profileBId, c]));

  const out: RankedMatch[] = [];
  const toInsert: { profileAId: string; profileBId: string; engineVersion: string; eligible: boolean; score: number; tier: string; result: string }[] = [];

  for (const row of candidates) {
    const candidate = JSON.parse(row.data) as CompatibilityProfile;
    let result: MatchResult;
    const hit = cacheByB.get(row.id);
    if (hit) {
      result = JSON.parse(hit.result) as MatchResult;
    } else {
      result = matchProfiles(seeker, candidate);
      toInsert.push({
        profileAId: seeker.profileId,
        profileBId: row.id,
        engineVersion: ENGINE_VERSION,
        eligible: result.eligible,
        score: result.score,
        tier: result.tier,
        result: JSON.stringify(result),
      });
    }
    out.push({
      ...result,
      candidate: {
        profileId: candidate.profileId,
        displayName: candidate.displayName,
        demographics: candidate.demographics,
        traits: candidate.traits,
        intent: candidate.intent,
        children: candidate.children,
      },
    });
  }

  if (toInsert.length) {
    await prisma.matchResult.createMany({ data: toInsert });
  }

  return out.sort((x, y) => Number(y.eligible) - Number(x.eligible) || y.score - x.score);
}

export async function matchStoredPair(seeker: CompatibilityProfile, otherProfileId: string): Promise<RankedMatch> {
  const row = await prisma.profile.findUnique({ where: { id: otherProfileId } });
  if (!row) throw new HttpError(404, "profile_not_found", "That profile does not exist.");
  const candidate = JSON.parse(row.data) as CompatibilityProfile;
  const result = matchProfiles(seeker, candidate);
  return {
    ...result,
    candidate: {
      profileId: candidate.profileId,
      displayName: candidate.displayName,
      demographics: candidate.demographics,
      traits: candidate.traits,
      intent: candidate.intent,
      children: candidate.children,
    },
  };
}

/** Loads all demo-flagged profiles (public demo journey). */
export async function loadDemoProfiles(): Promise<CompatibilityProfile[]> {
  const rows = await prisma.profile.findMany({ where: { isDemo: true }, orderBy: { createdAt: "asc" } });
  return rows.map((r) => JSON.parse(r.data) as CompatibilityProfile);
}
