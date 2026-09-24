import { requireUser } from "@/lib/auth/session";
import { jsonOk, withErrorHandling } from "@/lib/server/http";
import { getProfileForUser } from "@/lib/server/services/assessment";

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  return jsonOk({ profile: await getProfileForUser(user.id) });
});
