import { cookies } from "next/headers";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/auth/session";
import { clientIp, jsonError, jsonOk, rateLimit, readJson, withErrorHandling } from "@/lib/server/http";
import { loginUser } from "@/lib/server/services/auth";

export const POST = withErrorHandling(async (req) => {
  if (!rateLimit(`login:${clientIp(req)}`, 20, 60_000)) return jsonError(429, "rate_limited", "Too many attempts. Try again in a minute.");
  const user = await loginUser(await readJson(req));
  const token = await createSessionToken(user);
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions());
  return jsonOk({ user });
});
