# Deployment

## Local

```bash
cp .env.example .env            # then set real secrets (see below)
npm install
npm run db:push
npm run db:seed
npm run dev                      # http://localhost:3000
```

Demo login: `demo@ip360.app` / `Demo1234!` (admin). Eleven more personas use
`<name>@demo.ip360.app` with the same password.

## Environment variables

| Name | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | `file:./dev.db` (SQLite) or a Postgres URL. |
| `SESSION_SECRET` | yes | ≥ 32 chars. Signs session JWTs. Rotate to log everyone out. |
| `ASSESSMENT_ENCRYPTION_KEY` | yes | 64 hex chars (32 bytes). Encrypts answers at rest. **Back this up**; rotation requires re-encrypting `Assessment.payload`. |
| `NEXT_PUBLIC_APP_URL` | yes | Public URL, used in docs and OpenAPI `servers`. |
| `DEMO_API_KEY` | no | Seeded partner key shown on `/developers`. Omit in production. |

Generate secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"   # SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"      # ASSESSMENT_ENCRYPTION_KEY
```

## Vercel + Neon/Supabase Postgres (recommended for the demo environment)

1. Create a Postgres database (Neon free tier is fine). Copy the pooled connection string.
2. In `prisma/schema.prisma` set `provider = "postgresql"`.
3. `npx prisma migrate dev --name init` locally against that database; commit `prisma/migrations`.
4. Push the repo to GitHub. Import in Vercel. Set the env vars above.
5. Build command: `prisma generate && prisma migrate deploy && next build` (or add
   `"postinstall": "prisma generate"` and run `migrate deploy` from CI).
6. After the first deploy, run the seed once: `DATABASE_URL=... npm run db:seed`.

## Docker (any host)

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json prisma ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
```

## Production checklist

- [ ] Postgres, not SQLite.
- [ ] Real `SESSION_SECRET` and `ASSESSMENT_ENCRYPTION_KEY`, stored in the host's secret manager.
- [ ] `DEMO_API_KEY` unset; issue partner keys from `/app/admin`.
- [ ] Replace the in-memory rate limiter (`src/lib/server/http.ts → rateLimit`) with Redis/Upstash
      if running more than one instance.
- [ ] Replace the offline geocoder (`src/lib/server/geocode.ts`) with a real provider.
- [ ] HTTPS only (the session cookie is `secure` in production).
- [ ] Database backups enabled; test a restore.
- [ ] Error monitoring (Sentry) wired into `withErrorHandling`.

## Maintenance

- **Change the questions**: edit `questions.ts`, bump `ASSESSMENT_VERSION`, update
  `tests/scoring.test.ts`. Old profiles keep their version in `meta.assessmentVersion`.
- **Change the rules**: edit `rules.ts`/`engine.ts`, bump `ENGINE_VERSION`, update
  `docs/MATCHING_RULES.md` and `tests/matching.test.ts`. The match cache invalidates itself.
- **Change the profile shape**: edit `profile.ts`, bump `PROFILE_SCHEMA_VERSION`, add a migration
  function for stored `Profile.data` if the change is not additive.
- Run `npm test` and `npm run lint` before every deploy; CI config is in `.github/workflows/ci.yml`.
