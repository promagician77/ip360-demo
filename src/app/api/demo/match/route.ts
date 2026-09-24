import { z } from "zod";
import { matchProfiles, rankCandidates } from "@/lib/matching";
import { clientIp, HttpError, jsonError, jsonOk, rateLimit, readJson, withErrorHandling } from "@/lib/server/http";
import { loadDemoProfiles } from "@/lib/server/services/matching";

const bodySchema = z.object({
  a: z.string().min(1).max(40),
  b: z.string().min(1).max(40).optional(),
});

/** Public demo: match two personas, or rank everyone against `a`. */
export const POST = withErrorHandling(async (req) => {
  if (!rateLimit(`demo:${clientIp(req)}`, 60)) return jsonError(429, "rate_limited", "Slow down a little.");
  const { a, b } = bodySchema.parse(await readJson(req));
  const profiles = await loadDemoProfiles();
  const pa = profiles.find((p) => p.profileId === `demo_${a}`);
  if (!pa) throw new HttpError(404, "unknown_persona", `No demo persona "${a}".`);
  if (b) {
    const pb = profiles.find((p) => p.profileId === `demo_${b}`);
    if (!pb) throw new HttpError(404, "unknown_persona", `No demo persona "${b}".`);
    return jsonOk({ result: matchProfiles(pa, pb) });
  }
  return jsonOk({ results: rankCandidates(pa, profiles) });
});
