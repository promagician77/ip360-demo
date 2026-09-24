import { requireUser } from "@/lib/auth/session";
import { jsonOk, withErrorHandling } from "@/lib/server/http";
import { requireProfileForUser } from "@/lib/server/services/assessment";
import { matchStoredPair } from "@/lib/server/services/matching";

export const GET = withErrorHandling<{ params: Promise<{ profileId: string }> }>(async (_req, ctx) => {
  const user = await requireUser();
  const { profileId } = await ctx.params;
  const seeker = await requireProfileForUser(user.id);
  return jsonOk({ match: await matchStoredPair(seeker, profileId) });
});
