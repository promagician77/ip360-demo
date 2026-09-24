import { getCurrentUser } from "@/lib/auth/session";
import { jsonOk, withErrorHandling } from "@/lib/server/http";

export const GET = withErrorHandling(async () => {
  const user = await getCurrentUser();
  return jsonOk({ user });
});
