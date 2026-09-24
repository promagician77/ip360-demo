import { prisma } from "../db/client";
import { sha256 } from "../server/crypto";
import { HttpError } from "../server/http";

export interface ApiPrincipal {
  apiKeyId: string;
  name: string;
  scopes: string[];
}

/**
 * Authenticates a partner request via `Authorization: Bearer <key>` or `X-API-Key`.
 * Keys are compared by SHA-256 hash; the plaintext is never stored.
 */
export async function authenticateApiKey(req: Request, requiredScope?: string): Promise<ApiPrincipal> {
  const header = req.headers.get("authorization");
  const raw = header?.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : req.headers.get("x-api-key")?.trim();
  if (!raw) {
    throw new HttpError(401, "missing_api_key", "Provide an API key via Authorization: Bearer <key> or X-API-Key.");
  }

  const key = await prisma.apiKey.findUnique({ where: { keyHash: sha256(raw) } });
  if (!key || key.revokedAt) throw new HttpError(401, "invalid_api_key", "API key is invalid or revoked.");

  const scopes = key.scopes.split(",").map((s) => s.trim());
  if (requiredScope && !scopes.includes(requiredScope) && !scopes.includes("*")) {
    throw new HttpError(403, "insufficient_scope", `This key lacks the ${requiredScope} scope.`);
  }

  // Fire and forget; never block the request on telemetry.
  prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
  return { apiKeyId: key.id, name: key.name, scopes };
}

export async function logApiRequest(p: {
  apiKeyId?: string;
  endpoint: string;
  method: string;
  status: number;
  latencyMs: number;
  ip?: string;
}) {
  try {
    await prisma.apiRequestLog.create({ data: p });
  } catch {
    /* logging must never fail a request */
  }
}
