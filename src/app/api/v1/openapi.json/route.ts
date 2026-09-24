import { buildOpenApi } from "@/lib/server/openapi";
import { env } from "@/lib/server/env";

export async function GET() {
  return Response.json(buildOpenApi(env.appUrl));
}
