import { DEMO_PERSONAS } from "@/lib/demo/personas";
import { jsonOk, withErrorHandling } from "@/lib/server/http";
import { loadDemoProfiles } from "@/lib/server/services/matching";

/** Public: demo personas with their generated profiles (no raw answers exposed). */
export const GET = withErrorHandling(async () => {
  const profiles = await loadDemoProfiles();
  const list = profiles.map((p) => ({
    slug: p.profileId.replace(/^demo_/, ""),
    tagline: DEMO_PERSONAS.find((d) => `demo_${d.slug}` === p.profileId)?.tagline ?? "",
    profile: p,
  }));
  return jsonOk({ profiles: list });
});
