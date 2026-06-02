# CBT Simulator — Phase 0 Setup Guide

## What This Scaffold Contains

```
cbt-simulator/
├── config/
│   ├── exam.config.ts      ← All exam parameters (single source of truth)
│   └── courses.ts          ← All 9 courses registry
├── prisma/
│   ├── schema.prisma       ← Full database schema (users, courses, questions, sessions)
│   ├── seed.ts             ← DB seed script (reads JSON → upserts 1,800 questions)
│   └── data/               ← PUT YOUR JSON FILES HERE (see Step 4)
├── lib/
│   ├── randomizer.ts       ← Stratified draw + option shuffle (D2: STRATIFIED)
│   └── scorer.ts           ← Server-side scoring engine
├── types/
│   └── index.ts            ← All TypeScript types (client-safe — no leaking correct_option)
└── SETUP.md                ← This file
```

---

## Step 1 — Create the Next.js project

```bash
npx create-next-app@latest cbt-simulator \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd cbt-simulator
```

## Step 2 — Install dependencies

```bash
# Database
npm install @prisma/client prisma

# Auth
npm install next-auth@beta @auth/prisma-adapter

# Utilities
npm install bcryptjs
npm install -D @types/bcryptjs

# Monitoring (add keys to .env later)
npm install @sentry/nextjs posthog-js
```

## Step 3 — Environment variables

Create `.env.local`:

```env
# Neon PostgreSQL (get from neon.tech dashboard)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."   # Neon requires this for migrations

# NextAuth
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# Email (for verification + password reset)
EMAIL_SERVER_HOST="smtp.resend.com"
EMAIL_SERVER_PORT=465
EMAIL_SERVER_USER="resend"
EMAIL_SERVER_PASSWORD="your-resend-api-key"
EMAIL_FROM="noreply@yourdomain.com"

# Monitoring (add after account creation)
NEXT_PUBLIC_POSTHOG_KEY=""
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
SENTRY_DSN=""
```

## Step 4 — Copy scaffold files into project

Copy all files from this scaffold into your Next.js project root.

Then copy the parsed question bank JSON files into `prisma/data/`:

```
prisma/data/
  psy202_questions.json   (200 questions)
  psy204_questions.json   (200 questions)
  psy206_questions.json   (200 questions)
  psy208_questions.json   (200 questions)
  psy262_questions.json   (199 → 200 questions after fix)
  psy264_questions.json   (200 questions)
  ssc202_questions.json   (200 questions)
  gst112_questions.json   (200 questions)
  gst212_questions.json   (200 questions)
```

These are the `*_questions.json` files from the parser output.

## Step 5 — Initialize Prisma

```bash
# Copy prisma/schema.prisma into your project
npx prisma generate         # generates Prisma client
npx prisma migrate dev --name init   # creates tables in Neon
```

## Step 6 — Add seed config to package.json

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

Then:

```bash
npm install -D ts-node
npx prisma db seed
```

Expected output:
```
═══════════════════════════════════════════════
  CBT Simulator — Database Seed
═══════════════════════════════════════════════

Seeding courses...
  ✅ PSY 202 — Physiological Psychology
  ✅ PSY 204 — Social Psychology
  ... (all 9)

Seeding questions...
  ✅ PSY 202: 200 questions
  ✅ PSY 204: 200 questions
  ... (all 9)

  Grand total: 1800 questions seeded  ✅

  Verification query:
    gst112       | 200  ✅
    gst212       | 200  ✅
    psy202       | 200  ✅
    psy204       | 200  ✅
    psy206       | 200  ✅
    psy208       | 200  ✅
    psy262       | 200  ✅
    psy264       | 200  ✅
    ssc202       | 200  ✅
═══════════════════════════════════════════════
```

## Step 7 — Deploy hello-world to Vercel

```bash
npm install -g vercel
vercel          # follow prompts, link to your project
vercel env pull # pulls env vars locally
```

Add `DATABASE_URL` and `DIRECT_URL` in Vercel dashboard → Settings → Environment Variables.

---

## Confirmed Decisions Baked Into This Scaffold

| Decision | Value | Where |
|---|---|---|
| Passing score | 40/70 (57%) | `exam.config.ts → PASSING_SCORE` |
| Question draw | Stratified by module | `randomizer.ts → drawStratified()` |
| Pause | Disabled | `exam.config.ts → PAUSE_ENABLED: false` |
| Privacy | NDPR | `exam.config.ts → PRIVACY_JURISDICTION` |
| Bloom's visibility | Hidden from all client types | `types/index.ts` (absent by design) |

---

## Next Phase

Once `npx prisma db seed` confirms 1,800 rows:

**Phase 2 — Authentication & Dashboard**
- `/app/auth/register` — email + password + display name
- `/app/auth/login` — credentials with NextAuth
- `/app/auth/forgot-password` — email reset (1hr expiry)
- `/app/dashboard` — 9 course cards with attempt history
- `/app/courses/[courseId]` — course lobby + "Start Practice"
