# Architecture

IP360 prototype: PairKnow™ (assessment → profile) and PairSync™ (profile pair → match result).

## Guiding decision

**The matching engine never sees raw assessment answers.** The only thing that crosses from
PairKnow into PairSync is a versioned, validated `CompatibilityProfile` JSON document. This is
what makes it possible to expose PairSync to external dating platforms: a partner can produce a
profile from our assessment, from their own questionnaire, or from a mix, and the engine treats
them all the same.

```
┌──────────────────────┐    CompatibilityProfile     ┌──────────────────────┐
│  PairKnow™           │ ─────────────────────────▶  │  PairSync™           │
│  questions.ts        │  (zod-validated, v1.0.0)    │  rules.ts            │
│  scoring.ts          │                             │  engine.ts           │
│  (raw answers →      │                             │  (profile pair →     │
│   profile)           │                             │   MatchResult +      │
└──────────────────────┘                             │   explanation)       │
         ▲                                           └──────────────────────┘
         │ encrypted answers                                   ▲
┌────────┴──────────────┐                            ┌─────────┴────────────┐
│ Web app (session auth)│                            │ Partner API (API key)│
│ /app/assessment       │                            │ /api/v1/pairsync/*   │
└───────────────────────┘                            └──────────────────────┘
```

## Layers

| Layer | Path | Responsibility |
| --- | --- | --- |
| Domain (pure) | `src/lib/assessment`, `src/lib/matching` | Question bank, scoring, profile schema, rules, engine, explanations. **No I/O, no framework imports.** Fully unit-tested. |
| Services | `src/lib/server/services` | Orchestrate domain + database: save drafts, submit assessments, rank stored candidates, cache results. |
| Infrastructure | `src/lib/server`, `src/lib/auth`, `src/lib/db` | Env validation, AES-GCM encryption, HTTP helpers, rate limiting, session JWTs, API-key auth, Prisma client. |
| Transport | `src/app/api/**` | Thin Next.js route handlers: parse → authenticate → call service → respond. |
| UI | `src/app/**`, `src/components` | Server components for data loading; client components for the wizard, demo, console. |

The domain layer can be lifted out into its own package (`@ip360/engine`) with zero changes when
PairSync needs to run as a separate service. The service layer already depends only on the
domain's exported functions.

## Request flows

### Assessment → profile (internal)

1. `PUT /api/assessment` autosaves `{answers, step}`. Payload is AES-256-GCM encrypted before it
   touches the database.
2. `POST /api/assessment/submit` validates the full response set with `assessmentResponsesSchema`,
   geocodes the city, calls `generateProfile()`, and in one transaction marks the assessment
   completed, replaces any existing profile, and stores the profile JSON plus a few indexed columns
   (age, gender, city, lat/lng, intent) for pool queries.
3. Cached `MatchResult` rows for the old profile are removed by cascade, so re-taking the
   assessment never serves stale matches.

### Matching (internal)

`GET /api/matches` loads the seeker's profile, loads every other profile, and calls
`matchProfiles()` for each pair not already cached under the current `ENGINE_VERSION`. Results are
cached in `MatchResult`. Bumping `ENGINE_VERSION` invalidates the cache automatically.

### Matching (partner API)

`POST /api/v1/pairsync/match` and `/rank` are **stateless**. They authenticate the API key by
SHA-256 hash, check scope and rate limit, validate both profiles with zod, run the engine, and log
only endpoint/status/latency. Request bodies are never persisted.

## Versioning

Three independent versions are stamped on data:

| Constant | Where | Purpose |
| --- | --- | --- |
| `ASSESSMENT_VERSION` | `questions.ts` | Which question bank produced the answers. |
| `PROFILE_SCHEMA_VERSION` | `profile.ts` | Shape of the profile contract. |
| `ENGINE_VERSION` | `matching/types.ts` | Which rule set produced a result; keys the match cache. |

Changing the methodology = bump `ENGINE_VERSION`, update rules, update tests. Old cached results
are ignored, historical profiles still work.

## Security controls

- Passwords: bcrypt (12 rounds); login runs bcrypt even for unknown users to blunt timing leaks.
- Sessions: HS256 JWT in an `httpOnly`, `sameSite=lax`, `secure` (prod) cookie, 7-day expiry,
  re-validated against the database on every server render.
- Assessment answers: field-level AES-256-GCM with a dedicated key (`ASSESSMENT_ENCRYPTION_KEY`),
  separate from the session secret. Rotating one does not affect the other.
- API keys: 24 random bytes, stored as SHA-256; plaintext returned once; scopes; instant revoke.
- Validation: every input crosses a zod schema; validation failures return 422 with field paths.
- Rate limiting: in-memory token buckets per IP (auth, demo) and per API key (v1). Swap for
  Redis/Upstash for multi-instance deploys (single function to replace in `http.ts`).
- Headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` set by `proxy.ts`.
- Body size: 512 KB cap before JSON parsing.
- Authorization: `/app/*` requires a session (optimistic redirect in `proxy.ts`, real check in the
  layout); `/app/admin` and `/api/admin/*` additionally require `role = admin`.

## Designed-in extension points for PairNavigate™ / PairThrive™

- `MatchResult` already stores the full explanation; a `Connection` table (pair + status +
  timestamps) is the only addition needed to start tracking outcomes.
- `RuleTrace` gives every result an auditable trail, which is the raw material for
  "what changed since you matched" feedback.
- Profiles are immutable snapshots tied to an assessment; re-assessment creates a new snapshot,
  which is what longitudinal insight needs.
- The `ApiRequestLog` table and per-key scopes are ready for additional partner scopes such as
  `pairnavigate:events`.
