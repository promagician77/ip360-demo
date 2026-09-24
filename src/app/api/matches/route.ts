import { requireUser } from "@/lib/auth/session";
import { jsonOk, withErrorHandling } from "@/lib/server/http";
import { requireProfileForUser } from "@/lib/server/services/assessment";
import { rankStoredCandidates } from "@/lib/server/services/matching";

/** Ranked matches for the signed-in user. */
export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  const seeker = await requireProfileForUser(user.id);
  const matches = await rankStoredCandidates(seeker);
  return jsonOk({ seeker: seeker.profileId, count: matches.length, matches });
});
