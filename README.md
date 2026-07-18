# GlucoDose

Full-stack production build of the GlucoDose diabetes-companion app, built from
the design handoff in `design_handoff_glucodose/` (kept in this repo for
reference). Recreates the prototype's screens and dose-calculation logic on a
real backend: hashed-password auth with server sessions, a relational
database, and one-time Stripe payments for Premium — replacing the
prototype's localStorage + plaintext-password + fake-subscription-flag setup.

## Stack

- **Next.js 14** (App Router, TypeScript) — both the front end and the API
  routes live in this one app.
- **Prisma** ORM. Local dev uses **SQLite** (zero setup, `prisma/dev.db`,
  gitignored) — see [Database](#database) for switching to Postgres.
- **Auth**: bcrypt password hashing + signed JWT session cookie (httpOnly),
  verified in `src/middleware.ts` for route protection and in
  `src/lib/auth.ts` for API routes.
- **Stripe Checkout** in one-time `payment` mode (not `subscription`) for the
  $29.99 lifetime Premium unlock, confirmed server-side via webhook — the
  client can never flip its own entitlement.

## Getting started

```bash
npm install
cp .env.example .env        # fill in AUTH_SECRET at minimum to run locally
npx prisma migrate dev      # creates prisma/dev.db and applies the schema
npm run dev
```

Open http://localhost:3000 — it redirects to `/login` (sign up → onboarding →
dashboard).

## Environment variables

See `.env.example`. `DATABASE_URL` and `AUTH_SECRET` are required to boot the
app. `STRIPE_*` are only required to actually complete a Premium purchase —
without them, `/api/subscription/checkout` returns a clear 503 instead of
crashing, so the rest of the app works fine without a Stripe account
configured.

## Database

`prisma/schema.prisma` models the tables described in the original design
handoff: `users`, `profiles`, `custom_foods`, `log_entries`, `subscriptions`.
It targets SQLite for zero-setup local dev. To run against Postgres for
production:

1. Change `datasource db { provider = "sqlite" ... }` to `provider = "postgresql"`.
2. Point `DATABASE_URL` at your Postgres instance.
3. `npx prisma migrate dev` to regenerate migrations against Postgres (SQLite
   migration history doesn't carry over).

The schema intentionally avoids SQLite-only types/features so this is a
one-line provider change, not a schema rewrite.

## Auth

Username/password auth (matching the prototype's username-based login) — see
`src/lib/auth.ts` and `src/app/api/auth/*`. Passwords are hashed with bcrypt
(never stored or compared in plaintext). Sessions are HS256 JWTs in an
httpOnly, sameSite=lax cookie, verified at the edge in `src/middleware.ts` for
`/dashboard`, `/setup`, `/history`, `/premium`, `/onboarding`.

**Password reset** (a gap flagged in the original design handoff, now
closed): email is optional at signup and editable later from Setup
(`PUT /api/account/email`). `POST /api/auth/forgot-password` issues a
single-use, SHA-256-hashed, 1-hour-expiry token (`PasswordResetToken` model)
and emails a `/reset-password?token=...` link via `src/lib/email.ts`; the
response is identical whether or not the email is registered, to avoid
account enumeration. Without `RESEND_API_KEY` configured, the email is logged
to the server console and the link is also returned directly in the API
response in non-production, so the flow is fully testable without a real
provider. `POST /api/auth/reset-password` validates the token, updates the
password hash, and invalidates all other outstanding reset tokens for that
account.

**Rate limiting** (`src/lib/rateLimit.ts`): an in-memory fixed-window limiter
applied to `login` (20/15min per IP, 10/15min per username — blunts both a
single attacker guessing many usernames and credential stuffing spread across
IPs), `signup` (8/hour per IP), `forgot-password` (10/hour per IP, 5/hour per
email so one inbox can't be flooded from many IPs), and `reset-password`
(20/hour per IP, defense in depth — the tokens themselves are already
infeasible to brute-force). Blocked requests get `429` with a `Retry-After`
header. See the "Known gaps" note below on scaling this past one instance.

## Payments

`src/app/api/subscription/checkout/route.ts` creates a Stripe Checkout
Session with `mode: "payment"` (one-time, not recurring) against a single
non-recurring Price (`STRIPE_PREMIUM_PRICE_ID`, $29.99). Entitlement
(`Subscription.isPremium`) is **only** ever set by
`src/app/api/webhooks/stripe/route.ts`, which verifies the Stripe webhook
signature and reacts to `checkout.session.completed` — the client-facing
checkout route never sets it directly. Point your Stripe webhook at
`/api/webhooks/stripe` (use the Stripe CLI — `stripe listen --forward-to
localhost:3000/api/webhooks/stripe` — for local testing).

The one-time 7-day free trial (`src/app/api/subscription/trial/route.ts`) is
also server-authoritative: it checks `trialUsed` server-side so it can only
be claimed once per account, regardless of what the client sends.

If shipping as a native iOS/Android app instead of web, swap this for
StoreKit / Google Play Billing (non-consumable product) as noted in the
original design handoff — the "pay once, keep forever" model maps directly.

## Calculation logic

`src/lib/calc.ts` ports the prototype's dose formulas verbatim (500 rule for
carb ratio, 1500/1700/2000 rule for ISF, BG range classification, mg/dL↔mmol/L
conversion). Do not change these without product/clinical sign-off. Covered by
unit tests in `src/lib/calc.test.ts` and `src/lib/profileDto.test.ts` — run
with `npm test`.

## Project structure

```
src/
  app/
    login/, onboarding/          — public-ish auth + setup flow
    (app)/dashboard|history|setup|premium/  — protected app shell (shared TopNav)
    api/                         — auth, profile, foods, entries, subscription, stripe webhook
  components/                    — design-system primitives (ui.tsx) + Calculator/History widgets
  context/                       — AuthContext (session/profile), AppDataContext (entries/foods), LangContext
  lib/                           — db client, auth, calc, food DB, constants, validation (zod), Stripe client
prisma/schema.prisma             — data model
design_handoff_glucodose/        — original design/behavior reference (kept for pixel/formula fidelity)
```

## Known gaps / follow-ups

- Next.js 14.2.x has several patched CVEs only fixed in Next 16 (a breaking
  major-version upgrade) — worth scheduling before production launch;
  `npm audit` has details.
- i18n: only nav/auth chrome strings are translated (EN/AR); screen body copy
  is English-only, matching the prototype's stated scope — full i18n +
  RTL-testing every screen is called out as follow-up work in the original
  handoff.
- Test coverage is limited to the dosing/ratio math and rate limiter (the
  safety-critical / security-critical parts); API routes and UI flows are
  verified manually but not covered by automated integration/e2e tests yet.
- Rate limiting (`src/lib/rateLimit.ts`) is in-memory, fine for a
  single-instance deployment but reset on restart and not shared across
  instances — swap for a shared store (e.g. Upstash Redis) before running
  multiple instances/serverless replicas in production.
