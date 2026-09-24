# Database

Prisma ORM. The demo ships with SQLite so it runs anywhere with zero setup; production uses
PostgreSQL. The schema is provider-neutral: JSON documents are stored in `String` columns and
parsed by the service layer, so the same `schema.prisma` works on both. Switching:

```prisma
datasource db {
  provider = "postgresql"   // was "sqlite"
  url      = env("DATABASE_URL")
}
```

then `npx prisma migrate dev --name init`. Optionally change `data`/`result`/`payload` columns to
`Json` on Postgres for querying inside the document.

## Entity overview

```
User 1───* Assessment 1───1 Profile *───* MatchResult
 │                                        (A, B, engineVersion)
 └──* ApiKey 1───* ApiRequestLog
```

| Table | Purpose | Notes |
| --- | --- | --- |
| `User` | Account | `role` = `user` \| `admin`. Password is bcrypt. |
| `Assessment` | Raw PairKnow answers | `payload` is AES-256-GCM ciphertext (`v1:iv:tag:ct`). `status` = `in_progress` \| `completed`. `version` = question bank version. One in-progress draft per user; completed rows are kept for history. |
| `Profile` | Structured compatibility profile | `data` = full `CompatibilityProfile` JSON. Indexed scalar copies (`age`, `gender`, `city`, `lat`, `lng`, `intent`) for pool filtering. `isDemo` marks seeded personas shown on the public demo. One per user (unique). |
| `MatchResult` | Cache of engine output | Unique on `(profileAId, profileBId, engineVersion)`. Deleted by cascade when either profile is replaced. |
| `ApiKey` | Partner credentials | `keyHash` = SHA-256 of the key; `prefix` for display; comma-separated `scopes`; `revokedAt`. |
| `ApiRequestLog` | Partner telemetry | Endpoint, method, status, latency, IP. Never the body. |

## Data protection

- Answers (`Assessment.payload`) are the most sensitive data and are encrypted with a key that is
  not the session secret. Losing `ASSESSMENT_ENCRYPTION_KEY` makes drafts unreadable; profiles
  remain usable because they are derived and stored separately.
- Profiles contain preference and intent data but no free-text answers other than a short bio.
- Deleting a `User` cascades to assessments, profiles, match results and API keys.

## Commands

```bash
npm run db:push      # sync schema to the database (dev)
npm run db:seed      # load 12 demo personas + demo API key (idempotent)
npm run db:reset     # drop, recreate, reseed
npx prisma studio    # browse data
```

For production use migrations instead of `db push`:

```bash
npx prisma migrate dev --name <change>   # locally, commits a migration
npx prisma migrate deploy                # in CI/CD against production
```
