# Database

Prisma ORM on PostgreSQL. The demo environment uses Neon (attached through Vercel Storage);
locally, point `DATABASE_URL` at any Postgres, including the same Neon database. Migrations live in
`prisma/migrations` and are applied by `prisma migrate deploy` during every build.

JSON documents are stored in `String` columns and parsed by the service layer, so the schema is
provider-neutral. For a throwaway local database you can flip `provider` to `"sqlite"` and use
`prisma db push`; do not commit that change.

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
npm run db:migrate   # apply committed migrations
npm run db:seed      # load 12 demo personas + demo API key (idempotent)
npm run db:reset     # drop, recreate, reseed (development only)
npx prisma studio    # browse data
```

Schema changes: edit `schema.prisma`, run `npx prisma migrate dev --name <change>` against a
development database, and commit the new folder under `prisma/migrations`. The build applies it.
