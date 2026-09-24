import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UnauthorizedError } from "../auth/session";

/** Consistent JSON error envelope: { error: { code, message, details? } } */
export function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ error: { code, message, ...(details ? { details } : {}) } }, { status });
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

/** Wraps a route handler with uniform error handling. */
export function withErrorHandling<Ctx>(
  handler: (req: Request, ctx: Ctx) => Promise<Response>,
): (req: Request, ctx: Ctx) => Promise<Response> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof UnauthorizedError) return jsonError(401, "unauthorized", err.message);
      if (err instanceof ZodError) {
        return jsonError(
          422,
          "validation_error",
          "Request body failed validation.",
          err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        );
      }
      if (err instanceof HttpError) return jsonError(err.status, err.code, err.message, err.details);
      if (err instanceof SyntaxError) return jsonError(400, "bad_json", "Request body is not valid JSON.");
      console.error("[api] unhandled", err);
      return jsonError(500, "internal_error", "Something went wrong on our side.");
    }
  };
}

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export async function readJson(req: Request): Promise<unknown> {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > 512 * 1024) throw new HttpError(413, "payload_too_large", "Body exceeds 512 KB.");
  return req.json();
}

/* ------------------------------ Rate limiting ------------------------------ */
// In-memory token bucket, per process. Replace with Redis/Upstash for multi-instance deploys.
const buckets = new Map<string, { tokens: number; updated: number }>();

export function rateLimit(key: string, limit = 60, windowMs = 60_000): boolean {
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: limit, updated: now };
  const refill = ((now - b.updated) / windowMs) * limit;
  b.tokens = Math.min(limit, b.tokens + refill);
  b.updated = now;
  if (b.tokens < 1) {
    buckets.set(key, b);
    return false;
  }
  b.tokens -= 1;
  buckets.set(key, b);
  return true;
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local"
  );
}
