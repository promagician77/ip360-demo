import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { requireUser } from "@/lib/auth/session";
import { generateApiKey } from "@/lib/server/crypto";
import { HttpError, jsonOk, readJson, withErrorHandling } from "@/lib/server/http";

async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") throw new HttpError(403, "forbidden", "Admin access required.");
  return user;
}

export const GET = withErrorHandling(async () => {
  await requireAdmin();
  const keys = await prisma.apiKey.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, prefix: true, scopes: true, lastUsedAt: true, revokedAt: true, createdAt: true, _count: { select: { requests: true } } },
  });
  return jsonOk({ keys });
});

const createSchema = z.object({
  name: z.string().trim().min(1).max(60),
  scopes: z.array(z.enum(["pairsync:match", "pairknow:profile"])).min(1).default(["pairsync:match"]),
});

/** Creates a key. The plaintext is returned exactly once. */
export const POST = withErrorHandling(async (req) => {
  const admin = await requireAdmin();
  const data = createSchema.parse(await readJson(req));
  const { key, prefix, hash } = generateApiKey();
  const row = await prisma.apiKey.create({
    data: { name: data.name, prefix, keyHash: hash, ownerId: admin.id, scopes: data.scopes.join(",") },
  });
  return jsonOk({ id: row.id, name: row.name, prefix, key }, { status: 201 });
});

const revokeSchema = z.object({ id: z.string().min(1) });

export const DELETE = withErrorHandling(async (req) => {
  await requireAdmin();
  const { id } = revokeSchema.parse(await readJson(req));
  await prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
  return jsonOk({ ok: true });
});
