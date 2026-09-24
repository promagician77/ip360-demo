# API reference

Two API surfaces:

- **Internal** (`/api/*`): used by the web app, authenticated by the session cookie.
- **Partner v1** (`/api/v1/*`): stateless, authenticated by API key. Documented in OpenAPI at
  `/api/v1/openapi.json` and interactively at `/developers`.

All errors use one envelope:

```json
{ "error": { "code": "validation_error", "message": "…", "details": [{ "path": "…", "message": "…" }] } }
```

## Partner v1

Auth: `Authorization: Bearer <key>` or `X-API-Key: <key>`.

| Method | Path | Scope | Rate limit | Description |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/health` | none | — | Status and versions. |
| GET | `/api/v1/pairknow/questions` | none | — | Question bank (dimensions, structured, Likert). |
| POST | `/api/v1/pairknow/profile` | `pairknow:profile` | 120/min | `{ profileId, responses }` → `{ profile, geocoded }`. |
| POST | `/api/v1/pairsync/match` | `pairsync:match` | 120/min | `{ profileA, profileB, options? }` → `{ result }`. |
| POST | `/api/v1/pairsync/rank` | `pairsync:match` | 60/min | `{ seeker, candidates[≤200], options? }` → `{ seeker, count, results[] }`. |
| GET | `/api/v1/openapi.json` | none | — | OpenAPI 3.1. |

### Example: score a pair

```bash
curl -s -X POST http://localhost:3000/api/v1/pairsync/match \
  -H "Authorization: Bearer $DEMO_API_KEY" \
  -H "Content-Type: application/json" \
  -d @pair.json | jq '.result | {score, tier, headline: .explanation.headline}'
```

`options.includeRuleTrail` (default `true` for match, `false` for rank) toggles the per-rule audit
trail in the response.

### MatchResult

| Field | Meaning |
| --- | --- |
| `eligible` | All eligibility rules passed. |
| `score` | 0–100 composite. Always 0 when ineligible. |
| `baseScore` | Weighted dimension score before modifiers. |
| `modifierTotal` | Sum of modifiers after the ±15 cap. |
| `tier` | `exceptional` (85+), `strong` (70+), `promising` (55+), `limited`, `ineligible`. |
| `distanceKm` | Haversine distance. |
| `explanation.headline / summary` | One-line and one-paragraph plain-English result. |
| `explanation.strengths / watchouts` | Bullet lists for UI. |
| `explanation.dimensions[]` | Per-dimension scores, weight, contribution, band, narrative. |
| `explanation.ruleTrail[]` | Every rule evaluated with outcome and delta. |

## Internal

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | `{ email, password, displayName }` → sets session cookie. |
| POST | `/api/auth/login` | `{ email, password }` → sets session cookie. |
| POST | `/api/auth/logout` | Clears cookie. |
| GET | `/api/auth/me` | Current user or `null`. |
| GET | `/api/assessment` | `{ status, step, answers, … }` (answers decrypted for the owner only). |
| PUT | `/api/assessment` | Autosave `{ answers, step }`. |
| POST | `/api/assessment/submit` | Full responses → `{ profile }` (201). |
| GET | `/api/profile` | `{ profile }` or `{ profile: null }`. |
| GET | `/api/matches` | Ranked matches for the current user (cached). |
| GET | `/api/matches/:profileId` | One match with full explanation. |
| GET | `/api/demo/profiles` | Public: seeded demo profiles. |
| POST | `/api/demo/match` | Public: `{ a, b? }` persona slugs → result or ranking. |
| GET/POST/DELETE | `/api/admin/api-keys` | Admin: list / create / revoke partner keys. |
| GET | `/api/admin/overview` | Admin: counts and recent API requests. |
