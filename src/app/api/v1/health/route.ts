import { ASSESSMENT_VERSION } from "@/lib/assessment/questions";
import { PROFILE_SCHEMA_VERSION } from "@/lib/assessment/profile";
import { ENGINE_VERSION } from "@/lib/matching";
import { jsonOk } from "@/lib/server/http";

export async function GET() {
  return jsonOk({
    status: "ok",
    service: "ip360-prototype",
    versions: { assessment: ASSESSMENT_VERSION, profileSchema: PROFILE_SCHEMA_VERSION, engine: ENGINE_VERSION },
    time: new Date().toISOString(),
  });
}
