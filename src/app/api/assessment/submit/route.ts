import { requireUser } from "@/lib/auth/session";
import { jsonOk, readJson, withErrorHandling } from "@/lib/server/http";
import { submitAssessment } from "@/lib/server/services/assessment";

/** Validates the complete response set and generates the compatibility profile. */
export const POST = withErrorHandling(async (req) => {
  const user = await requireUser();
  const profile = await submitAssessment(user.id, await readJson(req));
  return jsonOk({ profile }, { status: 201 });
});
