"use client";

import { useEffect, useState } from "react";
import type { CompatibilityProfile } from "@/lib/assessment/profile";
import { Spinner } from "./ui";

type Endpoint = "match" | "rank" | "profile";

export function ApiConsole({ demoKey }: { demoKey: string }) {
  const [profiles, setProfiles] = useState<CompatibilityProfile[]>([]);
  const [endpoint, setEndpoint] = useState<Endpoint>("match");
  const [body, setBody] = useState("");
  const [apiKey, setApiKey] = useState(demoKey);
  const [response, setResponse] = useState<{ status: number; ms: number; body: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/demo/profiles")
      .then((r) => r.json())
      .then((d) => {
        const list: CompatibilityProfile[] = (d.profiles ?? []).map((p: { profile: CompatibilityProfile }) => p.profile);
        setProfiles(list);
        setBody(templateFor("match", list));
      });
  }, []);

  const choose = (e: Endpoint) => {
    setEndpoint(e);
    setBody(templateFor(e, profiles));
    setResponse(null);
  };

  const path = endpoint === "match" ? "/api/v1/pairsync/match" : endpoint === "rank" ? "/api/v1/pairsync/rank" : "/api/v1/pairknow/profile";

  async function send() {
    setBusy(true);
    const started = performance.now();
    try {
      const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` }, body });
      const text = await res.text();
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {}
      setResponse({ status: res.status, ms: Math.round(performance.now() - started), body: pretty });
    } catch (e) {
      setResponse({ status: 0, ms: 0, body: String(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Try it</h2>
          <p className="text-xs text-fg-muted">Requests go to this deployment using the demo partner key. Edit the body freely.</p>
        </div>
        <div className="inline-flex rounded-full border border-line-strong p-0.5 text-sm">
          {(["match", "rank", "profile"] as Endpoint[]).map((e) => (
            <button key={e} className={`rounded-full px-3 py-1.5 font-semibold capitalize ${endpoint === e ? "bg-brand text-white" : "text-fg-muted"}`} onClick={() => choose(e)}>
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <label className="label">Request</label>
          <div className="mono mb-2 rounded-lg bg-bg-soft px-3 py-2 text-xs">
            <span className="font-bold text-sage">POST</span> {path}
          </div>
          <input className="input mono mb-2 text-xs" value={apiKey} onChange={(e) => setApiKey(e.target.value)} aria-label="API key" />
          <textarea className="input mono h-80 resize-y text-xs" value={body} onChange={(e) => setBody(e.target.value)} spellCheck={false} />
          <button className="btn btn-primary mt-3" onClick={send} disabled={busy || !body}>
            {busy && <Spinner />} Send request
          </button>
        </div>
        <div>
          <label className="label">Response</label>
          {response ? (
            <>
              <div className="mono mb-2 flex gap-4 rounded-lg bg-bg-soft px-3 py-2 text-xs">
                <span className={response.status >= 200 && response.status < 300 ? "font-bold text-sage" : "font-bold text-red-600"}>{response.status}</span>
                <span className="text-fg-muted">{response.ms} ms</span>
              </div>
              <pre className="code h-[26rem] overflow-auto scrollbar-thin">{response.body}</pre>
            </>
          ) : (
            <div className="grid h-[28rem] place-items-center rounded-xl border border-dashed border-line-strong text-sm text-fg-faint">Send a request to see the response.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function templateFor(endpoint: Endpoint, profiles: CompatibilityProfile[]): string {
  if (!profiles.length) return "";
  const [a, b, ...rest] = profiles;
  if (endpoint === "match") return JSON.stringify({ profileA: a, profileB: b, options: { includeRuleTrail: true } }, null, 2);
  if (endpoint === "rank") return JSON.stringify({ seeker: a, candidates: [b, ...rest].slice(0, 5), options: { limit: 5, eligibleOnly: false } }, null, 2);
  return JSON.stringify(
    {
      profileId: "partner_user_123",
      responses: {
        displayName: "Avery",
        age: 30,
        gender: "woman",
        city: "Denver",
        intent: "long_term",
        children: "open",
        relocation: "maybe",
        faithImportance: 2,
        smoking: "never",
        drinking: "socially",
        seeking: ["man"],
        ageMin: 27,
        ageMax: 38,
        maxDistanceKm: 100,
        dealbreakers: ["smoker"],
        weights: { values: 3, emotional: 3, lifestyle: 2, communication: 3, goals: 2, intimacy: 2 },
        likert: Object.fromEntries(
          ["v1", "v2", "v3", "v4", "v5", "e1", "e2", "e3", "e4", "e5", "l1", "l2", "l3", "l4", "l5", "c1", "c2", "c3", "c4", "c5", "g1", "g2", "g3", "g4", "g5", "i1", "i2", "i3", "i4", "i5"].map((id, i) => [id, [4, 3, 5, 2, 4][i % 5]]),
        ),
      },
    },
    null,
    2,
  );
}
