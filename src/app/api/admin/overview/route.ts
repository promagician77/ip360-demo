import { prisma } from "@/lib/db/client";
import { requireUser } from "@/lib/auth/session";
import { HttpError, jsonOk, withErrorHandling } from "@/lib/server/http";

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  if (user.role !== "admin") throw new HttpError(403, "forbidden", "Admin access required.");

  const [users, assessments, completed, profiles, matches, requests] = await Promise.all([
    prisma.user.count(),
    prisma.assessment.count(),
    prisma.assessment.count({ where: { status: "completed" } }),
    prisma.profile.count(),
    prisma.matchResult.count(),
    prisma.apiRequestLog.findMany({ orderBy: { createdAt: "desc" }, take: 25, include: { apiKey: { select: { name: true, prefix: true } } } }),
  ]);

  return jsonOk({ counts: { users, assessments, completed, profiles, matches }, requests });
});
