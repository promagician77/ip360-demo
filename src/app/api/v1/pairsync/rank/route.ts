import { z } from "zod";
import { compatibilityProfileSchema } from "@/lib/assessment/profile";
import { authenticateApiKey, logApiRequest } from "@/lib/auth/apiKey";
import { rankCandidates } from "@/lib/matching";
import { clientIp, jsonError, jsonOk, rateLimit, readJson, withErrorHandling } from "@/lib/server/http";

const bodySchema = z.object({
  seeker: compatibilityProfileSchema,
  candidates: z.array(compatibilityProfileSchema).min(1).max(200),
  options: z
    .object({
      limit: z.number().int().min(1).max(200).default(50),
      eligibleOnly: z.boolean().default(false),
      includeRuleTrail: z.boolean().default(false),
    })
    .default({ limit: 50, eligibleOnly: false, includeRuleTrail: false }),
});

/**
 * POST /api/v1/pairsync/rank
 * Ranks up to 200 candidates for one seeker.
 */
export const POST = withErrorHandling(async (req) => {
  const started = Date.now();
  const principal = await authenticateApiKey(req, "pairsync:match");
  if (!rateLimit(`key:${principal.apiKeyId}`, 60)) return jsonError(429, "rate_limited", "Rate limit exceeded (60/min).");

  const { seeker, candidates, options } = bodySchema.parse(await readJson(req));
  let results = rankCandidates(seeker, candidates);
  if (options.eligibleOnly) results = results.filter((r) => r.eligible);
  results = results.slice(0, options.limit);
  if (!options.includeRuleTrail) results.forEach((r) => (r.explanation.ruleTrail = []));

  const res = jsonOk({ seeker: seeker.profileId, count: results.length, results });
  await logApiRequest({ apiKeyId: principal.apiKeyId, endpoint: "/api/v1/pairsync/rank", method: "POST", status: 200, latencyMs: Date.now() - started, ip: clientIp(req) });
  return res;
});
