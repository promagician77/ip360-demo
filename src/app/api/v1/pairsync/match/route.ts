import { z } from "zod";
import { compatibilityProfileSchema } from "@/lib/assessment/profile";
import { authenticateApiKey, logApiRequest } from "@/lib/auth/apiKey";
import { matchProfiles } from "@/lib/matching";
import { clientIp, jsonError, jsonOk, rateLimit, readJson, withErrorHandling } from "@/lib/server/http";

const bodySchema = z.object({
  profileA: compatibilityProfileSchema,
  profileB: compatibilityProfileSchema,
  options: z.object({ includeRuleTrail: z.boolean().default(true) }).default({ includeRuleTrail: true }),
});

/**
 * POST /api/v1/pairsync/match
 * Scores one pair of profiles. Pure and stateless; safe for partners to call at volume.
 */
export const POST = withErrorHandling(async (req) => {
  const started = Date.now();
  const principal = await authenticateApiKey(req, "pairsync:match");
  if (!rateLimit(`key:${principal.apiKeyId}`, 120)) return jsonError(429, "rate_limited", "Rate limit exceeded (120/min).");

  const { profileA, profileB, options } = bodySchema.parse(await readJson(req));
  const result = matchProfiles(profileA, profileB);
  if (!options.includeRuleTrail) result.explanation.ruleTrail = [];

  const res = jsonOk({ result });
  await logApiRequest({ apiKeyId: principal.apiKeyId, endpoint: "/api/v1/pairsync/match", method: "POST", status: 200, latencyMs: Date.now() - started, ip: clientIp(req) });
  return res;
});
