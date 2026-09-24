import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { jsonOk, withErrorHandling } from "@/lib/server/http";

export const POST = withErrorHandling(async () => {
  (await cookies()).set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return jsonOk({ ok: true });
});
