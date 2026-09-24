# Developer handoff

Read this first, then `ARCHITECTURE.md`. You should be productive in under an hour.

## 1. Run it

```bash
cp .env.example .env
npm install && npm run db:push && npm run db:seed && npm run dev
```

Log in as `demo@ip360.app` / `Demo1234!`. Open `/demo` for the public journey and
`/developers` for the API console.

## 2. Where things live

```
src/
  lib/
    assessment/        PairKnow™: questions.ts (bank), scoring.ts (answers → profile), profile.ts (zod contract)
    matching/          PairSync™: rules.ts (one function per rule), engine.ts (pipeline + explanations), types.ts
    demo/personas.ts   12 personas used by seed, tests and /demo
    auth/              password.ts (bcrypt), session.ts (JWT cookie), apiKey.ts (partner keys)
    server/            env.ts, crypto.ts (AES-GCM), http.ts (errors, rate limit), geocode.ts, openapi.ts
    server/services/   assessment.ts, matching.ts, auth.ts  — the only code that touches Prisma besides pages
    db/client.ts       Prisma singleton
  app/
    api/               route handlers (thin)
    app/               signed-in area: overview, assessment, profile, matches, admin
    demo, developers, methodology, login, register, page.tsx (landing)
  components/          UI (ui.tsx primitives, RadarChart, AssessmentWizard, MatchExplanation, DemoJourney, ApiConsole …)
  proxy.ts             optimistic auth redirect + security headers
prisma/                schema.prisma, seed.ts
tests/                 vitest: scoring.test.ts, matching.test.ts
docs/                  this folder
```

## 3. The two things you'll be asked to change

**"Add/replace a question"** → `questions.ts`. Likert items need `dimension` and optionally
`reverse`/`facet`. If a facet feeds a trait rule, update `deriveTraits()` in `scoring.ts`.
Bump `ASSESSMENT_VERSION`. Update tests. The wizard, the review page and the partner
`/questions` endpoint all render from the bank automatically.

**"Change how matching works"** → `rules.ts` for a single rule, `engine.ts` for the pipeline
(weights, blend ratios, modifier cap, tiers, narratives). Bump `ENGINE_VERSION`. Update
`docs/MATCHING_RULES.md` and `tests/matching.test.ts`. Cached results invalidate themselves.

## 4. Testing approach

- `npm test` runs 40+ unit tests against the pure domain layer. Rules are tested individually
  (`ruleAge`, `childrenCompat`, …), then the pipeline (`matchProfiles`), then invariants:
  symmetry (A→B equals B→A), determinism, matrix symmetry, modifier cap, tier thresholds, and
  every demo persona producing a schema-valid profile.
- When the client provides worked examples ("these two people should score 78"), add them as
  golden tests in `tests/matching.test.ts`; that is the acceptance suite for the methodology.
- API contract: `/api/v1/openapi.json` is hand-maintained in `openapi.ts`; keep it in sync with
  the zod schemas in `profile.ts` (a future improvement is generating it from zod).

## 5. Conventions

- Domain code (`lib/assessment`, `lib/matching`) must stay free of I/O and framework imports so it
  can be tested and moved.
- Every API input goes through zod. Throw `HttpError(status, code, message)` for expected failures;
  `withErrorHandling` turns it into the standard envelope.
- Never log request bodies on `/api/v1/*`.
- Prettier-style formatting, 2 spaces, double quotes. `npm run lint` before pushing.

## 6. Known prototype shortcuts

| Shortcut | Production replacement |
| --- | --- |
| SQLite | Postgres (`docs/DATABASE.md`) |
| Offline city table geocoder | Mapbox/Google geocoding with caching |
| In-memory rate limiter | Redis/Upstash |
| Email/password only | Add OAuth or magic links via Auth.js if required |
| Full-pool ranking on each request | Pre-filter candidates in SQL by seeking/age/geo bounding box before running the engine |
| Hand-written OpenAPI | Generate from zod (`zod-to-openapi`) |

## 7. Roadmap hooks for PairNavigate™ / PairThrive™

- Add `Connection` (profileA, profileB, status, matchResultId, createdAt) when two people connect.
- Add `Event` (connectionId, type, payload, createdAt) for check-ins and feedback.
- Expose `pairnavigate:events` scope on API keys; the auth layer already supports scopes.
- Re-assessment creates a new `Profile` snapshot; diffing two snapshots is the basis for growth
  insight.
