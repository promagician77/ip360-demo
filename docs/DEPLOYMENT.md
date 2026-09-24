# Deployment

## Local

```bash
cp .env.example .env            # set DATABASE_URL (Postgres) and real secrets (see below)
npm install
npm run db:migrate
npm run db:seed
npm run dev                      # http://localhost:3000
```

If the app is already on Vercel, `vercel env pull .env` fetches the same variables for local use.

Demo login: `demo@ip360.app` / `Demo1234!` (admin). Eleven more personas use
`<name>@demo.ip360.app` with the same password.

## Environment variables

| Name | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL URL. Set automatically when you attach Neon from the Vercel Storage tab. |
| `SESSION_SECRET` | yes | ≥ 32 chars. Signs session JWTs. Rotate to log everyone out. |
| `ASSESSMENT_ENCRYPTION_KEY` | yes | 64 hex chars (32 bytes). Encrypts answers at rest. **Back this up**; rotation requires re-encrypting `Assessment.payload`. |
| `NEXT_PUBLIC_APP_URL` | yes | Public URL, used in docs and OpenAPI `servers`. |
| `DEMO_API_KEY` | no | Seeded partner key shown on `/developers`. Omit in production. |

Generate secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"   # SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"      # ASSESSMENT_ENCRYPTION_KEY
```

## Vercel + Neon Postgres (the demo environment)

1. In the Vercel project open **Storage → Create Database → Neon** (free tier) and connect it to the
   project. Vercel adds `DATABASE_URL` to the project's environment variables.
2. Under **Settings → Environment Variables** add `SESSION_SECRET`, `ASSESSMENT_ENCRYPTION_KEY`,
   `NEXT_PUBLIC_APP_URL` (your `https://….vercel.app` URL) and `DEMO_API_KEY`.
3. Redeploy. The build command (`package.json → build`) runs `prisma generate`,
   `prisma migrate deploy`, the seed, then `next build`, so the schema and demo data are created on
   the first deploy. The seed is idempotent, so every later deploy is safe.
4. Verify: `https://<app>/api/v1/health` returns `status: ok`, `/demo` lists twelve personas,
   and `demo@ip360.app` / `Demo1234!` signs in.

Why not SQLite on Vercel: the filesystem is read-only and per-instance, so a file database can
neither be written nor shared. Every Prisma call fails with a 500.

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
RUN npm run build   # generate + migrate + seed + build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000
CMD ["npm", "start"]
```

## Production checklist

- [ ] Postgres attached (Neon) and `DATABASE_URL` present in every environment.
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
