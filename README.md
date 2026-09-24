# IP360 · Intentional Pairing 360™ prototype

Working prototype of **PairKnow™** (assessment → structured compatibility profile) and
**PairSync™** (rules-based matching engine + REST API with human-readable explanations).

- Secure assessment experience with autosave, resume and retake
- Answers encrypted at rest (AES-256-GCM), profiles as a versioned JSON contract
- Deterministic rules engine: 6 eligibility rules, weighted 6-dimension scoring, 8 bounded
  modifiers, tiers, and a rule-by-rule audit trail in every result
- Partner API (`/api/v1/pairsync/*`, `/api/v1/pairknow/*`) with API keys, scopes, rate limits
  and an OpenAPI 3.1 spec
- Public demo journey with twelve seeded personas, an interactive API console, and an admin
  console for keys and traffic
- 40+ unit tests on the scoring and matching logic

## Quick start

```bash
cp .env.example .env            # set DATABASE_URL to a Postgres database (Neon free tier is fine)
npm install
npm run db:migrate              # apply prisma/migrations
npm run db:seed                 # 12 demo personas + demo API key (idempotent)
npm run dev
```

Open http://localhost:3000. Demo login `demo@ip360.app` / `Demo1234!`.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm test` | Vitest unit tests |
| `npm run lint` | ESLint |
| `npm run build && npm start` | Production build (also runs migrations + seed, as on Vercel) |
| `npm run db:migrate` / `db:seed` / `db:reset` | Apply migrations, seed, reset |

## Stack

Next.js 16 (App Router, TypeScript) · Tailwind CSS 4 · Prisma 6 + PostgreSQL ·
zod · jose (JWT sessions) · bcryptjs · Vitest.

## Design system

- **Type**: Fraunces (variable serif, local files in `src/fonts`) for display; Geist for body and mono.
- **Colour**: paper and ink base with one accent, ember. Match results are read as a *temperature*:
  frost (cold) → neutral → ember (hot). Ineligible pairs are "breakers" and get a fractured, icy treatment.
  Tokens live in `src/app/globals.css`; the tier palette was validated for colour-vision deficiency.
- **Charts**: the score gauge, dimension meters, temperature scale and radar are plain SVG/CSS in
  `src/components/ui.tsx` and `RadarChart.tsx`. No chart library.
- **Photography**: `public/images/*.jpg`, Unsplash licence. Replace freely; the layouts only assume landscape crops.

## Documentation

| Doc | Contents |
| --- | --- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layers, request flows, versioning, security controls, extension points |
| [docs/MATCHING_RULES.md](docs/MATCHING_RULES.md) | Every rule with ID, formula and threshold |
| [docs/API.md](docs/API.md) | Endpoint reference and response shapes |
| [docs/DATABASE.md](docs/DATABASE.md) | Schema, data protection, Postgres switch |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Local, Vercel, Docker, env vars, production checklist |
| [docs/HANDOFF.md](docs/HANDOFF.md) | Orientation for the next engineer |

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing |
| `/demo` | Public assessment-to-match journey with seeded personas |
| `/developers` | API docs + live console |
| `/methodology` | Scoring and matching rules, rendered from code |
| `/app` | Signed-in overview |
| `/app/assessment` | PairKnow™ wizard |
| `/app/profile` | Generated profile |
| `/app/matches`, `/app/matches/:id` | Ranked matches and full explanations |
| `/app/admin` | API keys, usage (admin only) |
