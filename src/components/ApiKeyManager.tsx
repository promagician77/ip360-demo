"use client";

import { useState } from "react";
import { Spinner } from "./ui";

interface KeyRow {
  id: string;
  name: string;
  prefix: string;
  scopes: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  requests: number;
}

export function ApiKeyManager({ initialKeys }: { initialKeys: KeyRow[] }) {
  const [keys, setKeys] = useState(initialKeys);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ name: string; key: string } | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/admin/api-keys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, scopes: ["pairsync:match", "pairknow:profile"] }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setCreated({ name: data.name, key: data.key });
      setKeys((k) => [
        { id: data.id, name: data.name, prefix: data.prefix, scopes: "pairsync:match,pairknow:profile", lastUsedAt: null, revokedAt: null, createdAt: new Date().toISOString(), requests: 0 },
        ...k,
      ]);
      setName("");
    }
  }

  async function revoke(id: string) {
    if (!confirm("Revoke this key? Partners using it will start receiving 401s immediately.")) return;
    await fetch("/api/admin/api-keys", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
    setKeys((k) => k.map((x) => (x.id === id ? { ...x, revokedAt: new Date().toISOString() } : x)));
  }

  return (
    <div className="card p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-semibold">Partner API keys</h2>
          <p className="text-xs text-fg-muted">Keys are stored hashed. The plaintext is shown once at creation.</p>
        </div>
        <form onSubmit={create} className="flex gap-2">
          <input className="input sm:w-56" placeholder="Partner name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} />
          <button className="btn btn-primary btn-sm" disabled={busy}>
            {busy && <Spinner />} Create key
          </button>
        </form>
      </div>

      {created && (
        <div className="mt-4 rounded-xl border border-sage/30 bg-sage-soft p-4 text-sm">
          <div className="font-semibold">Key for {created.name} (copy it now, it won&apos;t be shown again)</div>
          <code className="mono mt-2 block break-all rounded-lg bg-bg-elev px-3 py-2 text-xs">{created.key}</code>
        </div>
      )}

      <div className="mt-4 overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-fg-faint">
              <th className="pb-2 pr-4 font-semibold">Name</th>
              <th className="pb-2 pr-4 font-semibold">Prefix</th>
              <th className="pb-2 pr-4 font-semibold">Scopes</th>
              <th className="pb-2 pr-4 font-semibold">Requests</th>
              <th className="pb-2 pr-4 font-semibold">Last used</th>
              <th className="pb-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {keys.map((k) => (
              <tr key={k.id}>
                <td className="py-2 pr-4 font-medium">{k.name}</td>
                <td className="py-2 pr-4 mono text-xs">{k.prefix}…</td>
                <td className="py-2 pr-4 text-xs text-fg-muted">{k.scopes}</td>
                <td className="py-2 pr-4">{k.requests}</td>
                <td className="py-2 pr-4 text-fg-muted">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "never"}</td>
                <td className="py-2">
                  {k.revokedAt ? (
                    <span className="pill bg-bg-soft text-fg-faint">Revoked</span>
                  ) : (
                    <button className="text-xs font-semibold text-red-600" onClick={() => revoke(k.id)}>
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
