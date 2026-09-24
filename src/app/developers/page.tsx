import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ApiConsole } from "@/components/ApiConsole";
import { env } from "@/lib/server/env";
import { PageHero } from "@/components/PageHero";

export const metadata = { title: "API docs" };

const ENDPOINTS = [
  { method: "GET", path: "/api/v1/health", auth: "none", desc: "Service status and the assessment, profile-schema and engine versions." },
  { method: "GET", path: "/api/v1/pairknow/questions", auth: "none", desc: "The full PairKnow™ question bank so a partner can render the assessment in their own UI." },
  { method: "POST", path: "/api/v1/pairknow/profile", auth: "pairknow:profile", desc: "Raw answers in, CompatibilityProfile out. Stateless: nothing is stored." },
  { method: "POST", path: "/api/v1/pairsync/match", auth: "pairsync:match", desc: "Score one pair. Returns score, tier, dimension breakdown, explanation and rule trail." },
  { method: "POST", path: "/api/v1/pairsync/rank", auth: "pairsync:match", desc: "Rank up to 200 candidates for one seeker. Eligible first, highest score first." },
  { method: "GET", path: "/api/v1/openapi.json", auth: "none", desc: "OpenAPI 3.1 document for code generation and Postman/Insomnia import." },
];

export default function DevelopersPage() {
  const demoKey = process.env.DEMO_API_KEY ?? "";
  return (
    <>
      <SiteHeader />
      <PageHero img="/images/api.jpg" eyebrow="PairSync™ REST API" title={<>Integrate matching into <span className="display-italic">any</span> platform.</>} wash="photo-wash-full">
        The matching engine is exposed as a stateless API. Send two compatibility profiles, get back a score, a tier and a plain-English
        explanation. Profiles can come from our PairKnow™ assessment or from your own data mapped to the profile schema.
      </PageHero>
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-6">
            <div className="card p-6">
              <h2 className="display text-2xl">Endpoints</h2>
              <div className="mt-4 divide-y divide-line">
                {ENDPOINTS.map((e) => (
                  <div key={e.path} className="grid gap-1 py-3 sm:grid-cols-[70px_1fr] sm:gap-4">
                    <span className={`mono text-xs font-bold ${e.method === "GET" ? "text-sky" : "text-sage"}`}>{e.method}</span>
                    <div>
                      <div className="mono text-sm">{e.path}</div>
                      <div className="mt-0.5 text-sm text-fg-muted">{e.desc}</div>
                      <div className="mt-1 text-xs text-fg-faint">Auth: {e.auth}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h2 className="display text-2xl">Authentication</h2>
              <p className="mt-2 text-sm text-fg-muted">
                Partner keys are issued from the admin console and stored as SHA-256 hashes. Send the key as a bearer token or in the{" "}
                <code className="mono text-xs">X-API-Key</code> header. Keys carry scopes and can be revoked instantly.
              </p>
              <pre className="code mt-4">{`curl -X POST ${env.appUrl}/api/v1/pairsync/match \\
  -H "Authorization: Bearer ${demoKey || "<your-key>"}" \\
  -H "Content-Type: application/json" \\
  -d '{ "profileA": { ... }, "profileB": { ... } }'`}</pre>
            </div>

            <div className="card p-6">
              <h2 className="display text-2xl">Response shape</h2>
              <pre className="code mt-4">{`{
  "result": {
    "engineVersion": "1.0.0",
    "profileA": "demo_maya",
    "profileB": "demo_daniel",
    "eligible": true,
    "score": 93,
    "baseScore": 94,
    "modifierTotal": -1,
    "tier": "exceptional",
    "distanceKm": 0,
    "explanation": {
      "headline": "Exceptional match · 93/100",
      "summary": "Maya and Daniel align across nearly every dimension…",
      "strengths": ["Core Values (100): …", "Communication (100): …", "Life Direction (95): …"],
      "watchouts": ["Faith gap: Faith matters more to one of you…"],
      "dimensions": [{ "key": "values", "compatibility": 100, "weight": 0.19, "band": "excellent", "narrative": "…" }],
      "ruleTrail": [{ "ruleId": "E-01", "outcome": "pass", "detail": "…" }]
    }
  }
}`}</pre>
            </div>

            <div className="card p-6">
              <h2 className="display text-2xl">Errors</h2>
              <p className="mt-2 text-sm text-fg-muted">All errors share one envelope. Validation errors list every failing field path.</p>
              <pre className="code mt-4">{`{ "error": { "code": "validation_error", "message": "Request body failed validation.",
  "details": [{ "path": "profileA.demographics.age", "message": "Too small: expected number to be >=18" }] } }`}</pre>
              <ul className="mt-4 grid gap-1 text-sm text-fg-muted sm:grid-cols-2">
                <li>
                  <b className="mono text-xs">401</b> missing_api_key · invalid_api_key
                </li>
                <li>
                  <b className="mono text-xs">403</b> insufficient_scope
                </li>
                <li>
                  <b className="mono text-xs">413</b> payload_too_large
                </li>
                <li>
                  <b className="mono text-xs">422</b> validation_error
                </li>
                <li>
                  <b className="mono text-xs">429</b> rate_limited
                </li>
                <li>
                  <b className="mono text-xs">500</b> internal_error
                </li>
              </ul>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="card p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-fg-faint">Demo partner key</div>
              <code className="mono mt-2 block break-all rounded-lg bg-bg-soft px-3 py-2 text-xs">{demoKey || "Set DEMO_API_KEY and run the seed"}</code>
              <p className="mt-2 text-xs text-fg-muted">Scopes: pairsync:match, pairknow:profile. Rate limit 120 req/min.</p>
            </div>
            <div className="card p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-fg-faint">Versioning</div>
              <p className="mt-2 text-sm text-fg-muted">
                The URL carries the API major version. Every result also carries the engine version, and every profile its schema version, so
                partners can detect methodology changes without breaking.
              </p>
            </div>
            <div className="card p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-fg-faint">Privacy</div>
              <p className="mt-2 text-sm text-fg-muted">
                PairSync™ endpoints never persist request bodies. Only the endpoint, status and latency are logged per key.
              </p>
            </div>
            <a href="/api/v1/openapi.json" className="btn btn-secondary w-full">
              Download OpenAPI spec
            </a>
          </aside>
        </div>

        <div className="mt-8">
          <ApiConsole demoKey={demoKey} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
