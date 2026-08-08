# GlucoDose

Full-stack production build of the GlucoDose diabetes-companion app, built from
the design handoff in `design_handoff_glucodose/` (kept in this repo for
reference). Recreates the prototype's screens and dose-calculation logic on a
real backend: hashed-password auth with server sessions, a relational
database, and one-time Paymob payments for Premium — replacing the
prototype's localStorage + plaintext-password + fake-subscription-flag setup.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack) — both the front end and
  the API routes live in this one app.
- **Prisma** ORM. Local dev uses **SQLite** (zero setup, `prisma/dev.db`,
  gitignored) — see [Database](#database) for switching to Postgres.
- **Auth**: bcrypt password hashing + signed JWT session cookie (httpOnly),
  verified in `src/proxy.ts` (Next 16's renamed `middleware.ts` convention)
  for route protection and in `src/lib/auth.ts` for API routes.
- **Paymob Accept** (iframe-hosted card checkout) for the one-time $10
  lifetime Premium unlock — not a subscription, confirmed server-side via
  HMAC-verified webhook, never by the client.

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
app. `PAYMOB_*` are only required to actually complete a Premium purchase —
without them, `/api/subscription/checkout` returns a clear 503 instead of
crashing, so the rest of the app works fine without a Paymob account
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
httpOnly, sameSite=lax cookie, verified in `src/proxy.ts` (runs on the Node.js
runtime by default as of Next 16, not Edge) for `/dashboard`, `/setup`,
`/history`, `/premium`, `/onboarding`.

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

Uses [Paymob](https://paymob.com)'s **Accept** API (the standard iframe-hosted
checkout), not a subscription — a single $10 charge that unlocks Premium
forever. Paymob is the dominant payment processor in Egypt/MENA, which is
this app's target market (see the Arabic i18n and Egyptian food items in the
database).

`src/lib/paymob.ts` implements the three-call flow Paymob's Accept API
requires: `POST /auth/tokens` (API key → auth token) → `POST
/ecommerce/orders` (creates an order) → `POST /acceptance/payment_keys`
(order + billing data → a payment token), then redirects the user to
`https://accept.paymob.com/api/acceptance/iframes/{PAYMOB_IFRAME_ID}?payment_token=...`.
`src/app/api/subscription/checkout/route.ts` runs this and stores the
resulting order id on the user's `Subscription` row so the webhook can
correlate back to an account.

Entitlement (`Subscription.isPremium`) is **only** ever set by
`src/app/api/webhooks/paymob/route.ts`, which verifies the HMAC-SHA512
signature Paymob sends on its "Transaction processed" callback (computed
over a specific lexicographically-ordered field list — see
`HMAC_FIELD_ORDER` in `src/lib/paymob.ts`) before trusting the payload. The
client-facing checkout route never sets it directly. Configure this webhook
URL (`/api/webhooks/paymob`) as the **Transaction processed callback** in
your Paymob integration settings; separately, configure your **Transaction
redirection URL** (the browser-facing redirect after payment) to point at
`{NEXT_PUBLIC_APP_URL}/premium` — Paymob appends its own `?success=true|false`
query param to whatever URL you set there, which `/premium` reads to show
immediate UI feedback while polling for the webhook to actually land.

`billing_data` sent to Paymob (`buildBillingData` in `src/lib/paymob.ts`)
uses placeholder values for the shipping-only fields Paymob's e-commerce
form expects (apartment/floor/street/building/etc.) since this is a digital
product with nothing to ship. Real name/email come from the account when
available; there's no phone number field in the current signup/profile
flow, so that's sent as a placeholder too — worth adding a real phone field
before going live, since accurate billing data reduces fraud holds.

**Important:** the exact Paymob request/response field names and HMAC field
list were reconstructed from Paymob's public docs and several community
reference implementations (their docs site blocked automated fetching during
this build) — verify against your own dashboard/docs if you hit unexpected
API errors when wiring up real credentials, particularly `PAYMOB_CURRENCY`
and `PAYMOB_AMOUNT_CENTS`, which must exactly match what your specific
`PAYMOB_INTEGRATION_ID` is configured to accept.

The one-time 7-day free trial (`src/app/api/subscription/trial/route.ts`) is
server-authoritative: it checks `trialUsed` server-side so it can only be
claimed once per account, regardless of what the client sends.

If shipping as a native iOS/Android app instead of web, swap this for
StoreKit / Google Play Billing (non-consumable product) as noted in the
original design handoff — the "pay once, keep forever" model maps directly.

## Deploying

**Website** (Railway): `prisma/postgres/schema.prisma` is a Postgres variant
of the SQLite dev schema (see "Database" above) with its own `migrations/`
folder. The `prod-build` script in `package.json` (run via `railway.json`'s
`buildCommand`) generates the Prisma client, applies migrations, and builds
the app against it — deploying just needs `DATABASE_URL` (Railway's own
Postgres plugin provides this automatically as a reference variable) and
`AUTH_SECRET` set as Railway environment variables; no other setup is
required. (A Vercel-compatible `vercel-build` script pointing at the same
Postgres schema is also kept, if hosting there is ever preferred instead.)

**iOS (TestFlight)**: `capacitor.config.ts` wraps the deployed site in a
native WebView shell (via `server.url`, not a static bundle — this app has a
real backend, so the native shell just points at wherever it's hosted). The
`ios/` Xcode project was generated with `npx cap add ios`. Steps to build:

1. Deploy the website first (above) and get its URL.
2. Update `server.url` in `capacitor.config.ts` to that URL.
3. `npx cap sync ios` to pull the change into the Xcode project.
4. `npx cap open ios` (must run on macOS with Xcode installed) to open it,
   then use Xcode's Product > Archive > Distribute App flow to upload a
   build to App Store Connect / TestFlight.

**Before submitting to the App Store (not needed for TestFlight testing)**:
Apple requires digital goods/subscriptions to go through StoreKit, not an
external processor — the Paymob checkout (see "Payments" above) would need
to be swapped for StoreKit's in-app purchase API to pass App Review. This
doesn't block TestFlight, which only distributes to invited testers.

**Android (Google Play)**: same wrapping approach as iOS — the `android/`
Gradle project was generated with `npx cap add android`, and shares the same
`appId` (`com.glucodose.app`) and `server.url` in `capacitor.config.ts`.
Steps to build:

1. Deploy the website first (above) and confirm `server.url` in
   `capacitor.config.ts` points at it.
2. `npx cap sync android` to pull the config into the Gradle project.
3. `npx cap open android` (requires Android Studio) to open it, then use
   Build > Generate Signed App Bundle to produce a signed `.aab`. This
   requires creating a signing keystore the first time (Android Studio can
   generate one) — keep the keystore file and its passwords somewhere safe
   outside the repo; losing it means you can never update the app under the
   same listing again. Never commit the keystore or a `key.properties` file
   (already gitignored under `android/`).
4. Upload the `.aab` to Google Play Console's Internal testing track to
   install it on your own device immediately, or Closed testing to invite
   others — Play Console currently requires a closed test with 12+ opted-in
   testers running for 14+ days before a new developer account can apply for
   full Production access.

**Before submitting to Google Play (not needed for internal/closed
testing)**: same StoreKit-equivalent note as iOS — Google Play requires
digital goods/subscriptions to go through Google Play Billing rather than an
external processor, which would mean swapping out the Paymob checkout before
a production listing goes live. Internal/closed testing isn't blocked by
this.

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
    api/                         — auth, profile, foods, entries, subscription, paymob webhook
  components/                    — design-system primitives (ui.tsx) + Calculator/History widgets
  context/                       — AuthContext (session/profile), AppDataContext (entries/foods), LangContext
  lib/                           — db client, auth, calc, food DB, constants, validation (zod), Paymob client
prisma/schema.prisma             — data model
design_handoff_glucodose/        — original design/behavior reference (kept for pixel/formula fidelity)
```

## Known gaps / follow-ups

- One residual moderate `npm audit` advisory: Next 16 bundles its own
  internal `postcss@8.4.31` (build-tooling, not exposed to user input) with a
  known XSS-in-stringifier CVE; will resolve itself in a future Next.js patch
  release. Not fixable from this project's `package.json`.
- i18n: full UI-chrome translation (EN/AR) across every screen — labels,
  buttons, hints, error messages, badges — RTL-verified end-to-end in a real
  browser (mirrored layout, directional back-chevron, correct pluralization).
  Deliberately out of scope, matching the original handoff: the 100+ item
  food database and insulin/pill brand names, which are a content-catalog
  translation project, not UI chrome (brand names in particular are kept in
  Latin script since that's what's on the box regardless of locale).
- Test coverage is limited to the dosing/ratio math and rate limiter (the
  safety-critical / security-critical parts); API routes and UI flows are
  verified manually but not covered by automated integration/e2e tests yet.
- Rate limiting (`src/lib/rateLimit.ts`) is in-memory, fine for a
  single-instance deployment but reset on restart and not shared across
  instances — swap for a shared store (e.g. Upstash Redis) before running
  multiple instances/serverless replicas in production.
