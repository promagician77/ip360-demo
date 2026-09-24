import { requireUser } from "@/lib/auth/session";
import { jsonOk, readJson, withErrorHandling } from "@/lib/server/http";
import { getAssessmentState, saveDraft } from "@/lib/server/services/assessment";

/** Current assessment state (draft answers are decrypted server-side only for the owner). */
export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  return jsonOk(await getAssessmentState(user.id));
});

/** Autosave a draft. Body: { answers: Record<string, unknown>, step: number } */
export const PUT = withErrorHandling(async (req) => {
  const user = await requireUser();
  return jsonOk(await saveDraft(user.id, await readJson(req)));
});
