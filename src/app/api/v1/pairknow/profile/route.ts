import { z } from "zod";
import { generateProfile } from "@/lib/assessment/scoring";
import { authenticateApiKey, logApiRequest } from "@/lib/auth/apiKey";
import { clientIp, jsonError, jsonOk, rateLimit, readJson, withErrorHandling } from "@/lib/server/http";
import { geocodeCity } from "@/lib/server/geocode";

const bodySchema = z.object({
  profileId: z.string().min(1).max(80),
  responses: z.unknown(),
});

/**
 * Stateless profile generation for partners: raw PairKnow answers in,
 * CompatibilityProfile out. Nothing is stored.
 */
export const POST = withErrorHandling(async (req) => {
  const started = Date.now();
  const principal = await authenticateApiKey(req, "pairknow:profile");
  if (!rateLimit(`key:${principal.apiKeyId}`, 120)) return jsonError(429, "rate_limited", "Rate limit exceeded (120/min).");

  const body = bodySchema.parse(await readJson(req));
  const responses = body.responses as { city?: string; lat?: number; lng?: number };
  const geo = responses.lat !== undefined && responses.lng !== undefined ? { lat: responses.lat, lng: responses.lng, resolved: true } : geocodeCity(responses.city ?? "");

  const profile = generateProfile(body.responses, { profileId: body.profileId, lat: geo.lat, lng: geo.lng });
  const res = jsonOk({ profile, geocoded: geo.resolved });
  await logApiRequest({ apiKeyId: principal.apiKeyId, endpoint: "/api/v1/pairknow/profile", method: "POST", status: 200, latencyMs: Date.now() - started, ip: clientIp(req) });
  return res;
});
