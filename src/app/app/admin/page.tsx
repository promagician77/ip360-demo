import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { Stat } from "@/components/ui";
import { ApiKeyManager } from "@/components/ApiKeyManager";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/app");

  const [users, assessments, completed, profiles, matches, requests, keys] = await Promise.all([
    prisma.user.count(),
    prisma.assessment.count(),
    prisma.assessment.count({ where: { status: "completed" } }),
    prisma.profile.count(),
    prisma.matchResult.count(),
    prisma.apiRequestLog.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { apiKey: { select: { name: true, prefix: true } } } }),
    prisma.apiKey.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, prefix: true, scopes: true, lastUsedAt: true, revokedAt: true, createdAt: true, _count: { select: { requests: true } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <div className="eyebrow eyebrow-ember mb-2">Admin</div>
        <h1 className="display text-4xl">Platform overview</h1>
        <p className="mt-1 text-fg-muted">Usage counts, partner API keys and recent API traffic.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Users" value={users} />
        <Stat label="Assessments" value={assessments} hint={`${completed} completed`} />
        <Stat label="Profiles" value={profiles} />
        <Stat label="Cached matches" value={matches} />
        <Stat label="API requests" value={requests.length >= 20 ? "20+" : requests.length} hint="last 20 shown" />
      </div>

      <ApiKeyManager
        initialKeys={keys.map((k) => ({
          id: k.id,
          name: k.name,
          prefix: k.prefix,
          scopes: k.scopes,
          lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
          revokedAt: k.revokedAt?.toISOString() ?? null,
          createdAt: k.createdAt.toISOString(),
          requests: k._count.requests,
        }))}
      />

      <div className="card p-6">
        <h2 className="font-semibold">Recent API requests</h2>
        <div className="mt-4 overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-fg-faint">
                <th className="pb-2 pr-4 font-semibold">Time</th>
                <th className="pb-2 pr-4 font-semibold">Key</th>
                <th className="pb-2 pr-4 font-semibold">Endpoint</th>
                <th className="pb-2 pr-4 font-semibold">Status</th>
                <th className="pb-2 font-semibold">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {requests.map((r) => (
                <tr key={r.id}>
                  <td className="py-2 pr-4 whitespace-nowrap text-fg-muted">{r.createdAt.toLocaleString()}</td>
                  <td className="py-2 pr-4">{r.apiKey?.name ?? "—"}</td>
                  <td className="py-2 pr-4 mono text-xs">
                    {r.method} {r.endpoint}
                  </td>
                  <td className="py-2 pr-4">{r.status}</td>
                  <td className="py-2">{r.latencyMs} ms</td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-fg-muted">
                    No partner API traffic yet. Try the console on the API docs page.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
