# Handoff: GlucoDose — Diabetes Companion App

## Overview
GlucoDose is a diabetes self-management app: users create a profile with their diagnosis and insulin/pill regimen, the app auto-calculates their carb ratio (ICR) and insulin sensitivity factor (ISF) from clinical rules, and they use a food-search calculator to get meal/correction insulin dose suggestions. It logs meals, doses, and glucose readings to a history view with a time-in-range trend, and gates some features behind a one-time-purchase Premium tier (with a one-time 7-day free trial).

**This handoff is specifically to take the working front-end prototype and give it a real backend + real payments** — currently everything (accounts, history, premium status) lives in a single browser's `localStorage`, which does not scale across devices, isn't secure (plaintext passwords), and cannot process real charges.

## About the Design Files
The files in this bundle (`GlucoDose.html`, `app.jsx`, `components.jsx`, `screens-*.jsx`, `data.js`, `styles.css`) are a **design/behavior reference built as a static HTML+React (Babel in-browser) prototype** — not production code to deploy as-is. The task is to recreate this design and its interaction logic inside a real production stack (suggested: a standard React/Next.js or React Native front end, a real backend with a database, and a payment processor), reusing the visual design and calculation logic documented below.

## Fidelity
**High-fidelity.** Colors, type, spacing, copy, and all calculation formulas in the prototype are final — recreate them pixel-for-pixel and formula-for-formula. Layout is mobile-first, centered, max-width 480px (also works as a responsive desktop card).

---

## What needs real backend engineering

### 1. Authentication
Current prototype: username + plaintext password stored in `localStorage`, compared client-side. **Not secure — replace entirely.**
Needed:
- Real user accounts table, passwords hashed with bcrypt/argon2, never stored/compared in plaintext.
- Server-side session or JWT-based auth.
- Standard signup/login/logout endpoints. Consider adding password reset (not in current prototype — flag to product owner as a gap).

### 2. Data model (currently one big JSON blob in localStorage; needs real tables)
- **users**: id, username, password_hash, created_at
- **profiles** (1:1 with users): name, gender, age, diagnosis_date, diabetes_type (`type1`|`type2`|`gestational`|`other`), units (`mgdl`|`mmol`), treatment_mode (`insulin`|`pills`|`both`), insulin_delivery (`injections`|`pump`), rapid_insulin_type, rapid_units_per_day, basal_insulin_type, basal_units_per_day, pills (array/join table), carb_ratio, isf, carb_ratio_overridden (bool) — carb_ratio/isf are either auto-calculated (see formulas below) or manually overridden by the user
- **custom_foods** (per user): name, category, portion, carbs_grams
- **log_entries** (per user): type (`meal`|`mealCorrection`|`correction`|`hypo`|`bg`), timestamp, foods (json array of {name, qty, carbs}), carbs, current_bg, target_bg, dose, carbs_needed — see `data.js`/`screens-calculator.jsx`/`screens-history.jsx` for exact shape per entry type
- **subscriptions** (per user): is_premium (bool), trial_used (bool), trial_started_at (timestamp), purchased_at (timestamp), payment_reference (from processor)

### 3. Payments — real integration required
Current prototype: `onSubscribe`/`onStartTrial` just flip a local boolean, no real charge (see `app.jsx` `handleSubscribe`/`handleStartTrial` and `screens-subscription.jsx`).
Product requirements to preserve:
- **One-time purchase** (not recurring) — priced at $29.99 in the mock. Unlocks Premium permanently.
- **One-time 7-day free trial** available once per account before requiring purchase; after the trial window a paywall should require payment (see `screens-subscription.jsx` for exact copy/states: not started / trial active with days-remaining / trial expired / purchased).
- Recommended: **Stripe Checkout** (one-time payment mode, not subscription mode) if this is a web app, or **native in-app purchase** (StoreKit / Google Play Billing, non-consumable product) if shipped as an iOS/Android app — non-consumable IAP matches "pay once, keep forever" exactly.
- Webhook/server-to-server receipt validation is required to flip `is_premium` server-side — never trust a client-set flag for entitlement (the current prototype does, intentionally, since it's a demo).

### 4. Sync & offline
Users should see their data across devices once logged in — requires the backend described above rather than localStorage. Consider keeping optimistic local caching for snappy UX, syncing in the background.

---

## Calculation logic (must be reproduced exactly — see `data.js`)

Total Daily Dose: `TDD = rapid_units_per_day + basal_units_per_day`

**Carb ratio (ICR)** — grams of carbohydrate covered by 1 unit of rapid insulin:
```
carbRatio = 500 / TDD
```

**Insulin Sensitivity Factor (ISF)** — mg/dL drop per 1 unit of rapid insulin. Uses the basal:rapid ratio to pick 1500/1700/2000:
```
ratio = basal_units_per_day / rapid_units_per_day
numerator = ratio === 1 ? 1700 : ratio < 1 ? 1500 : 2000
ISF = numerator / TDD
```

**Carb rise** — mg/dL that 1g of carbohydrate raises blood glucose:
```
carbRise = ISF / carbRatio
```

**Dose formulas** (see `screens-calculator.jsx`):
- Meal dose = `totalCarbsInMeal / carbRatio`
- Correction dose = `max(0, (currentBG - targetBG) / ISF)`
- Meal + correction dose = meal dose + correction dose
- Hypo (low BG) — carbs needed to treat = `(targetBG - currentBG) / carbRise`, only shown when target > current

Users can **manually override** carbRatio/ISF if their doctor gave different numbers (onboarding review step and Setup screen "Recalculate" — toggle labeled "My doctor gave me different numbers").

Glucose range classification used for color-coding history/trends (`window.classifyBG` in `data.js`): `<70 mg/dL` = low, `>180 mg/dL` = high, else in range. mmol/L values are converted to mg/dL (`×18.0182`) before classifying.

---

## Screens / Views (see files listed below for full JSX)

1. **Auth** (`screens-auth.jsx`) — soft-blue header block, Log in/Sign up segmented control, username+password fields, EN/AR language toggle.
2. **Onboarding** (`screens-onboarding.jsx`) — 4-step flow: Profile basics → Diagnosis → Treatment (insulin/pump/pills, brand + units/day) → Review (calculated ratios + manual override toggle).
3. **Dashboard** (`screens-dashboard.jsx`) — the main home screen: Time-in-Range ring (conic-gradient), Quick Log (current BG / last insulin dose + "Log BG" button), embedded Carb Calculator, recent history preview, Premium banner if not subscribed.
4. **Calculator** (`screens-calculator.jsx`) — 4 modes (Meal / Meal+Correction / Correction only / Low BG hypo), searchable food picker (100+ item database in `data.js`, categorized, plus user-added custom foods with no limit), live dose result card.
5. **History** (`screens-history.jsx`) — filterable log list (All/Meals/Doses/Glucose), color-coded BG dot per entry (red/green/blue = high/in-range/low), 7/14/30-day Time-in-Range trend bar, "Log BG reading" modal. Free tier caps visible history at 15 entries with an upsell card.
6. **Setup** (`screens-profile.jsx`) — profile info, auto-ratio cards with "Recalculate" (reopens onboarding treatment step), edit treatment info, logout.
7. **Premium** (`screens-subscription.jsx`) — feature list, one-time price card, trial start button (hidden once used), trial-active/trial-expired banners, "Unlock Premium" purchase button.

Shared components in `components.jsx`: `AppShell`, `TopNav` (header + text tab nav), `DashboardCard`, `RingProgress`, `Button`, `Card`, `Field`, `TextInput`, `Select`, `SegmentedControl`, `Badge`, `StatTile`, `Modal`.

## Design Tokens (see `styles.css`)
- `--bg` / `--surface` / `--surface-2` / `--border`: near-white cool grays, oklch-based
- `--header` / `--header-text`: soft pastel blue header band
- `--primary` / `--primary-dark` / `--primary-tint`: blue (`oklch(55% 0.18 255)`) — main brand/action color
- `--good` / `--good-tint`: green — "in range" glucose semantic only
- `--danger` / `--danger-tint`: red — "high" glucose / hypo alerts only
- Most other UI (badges, stat tiles) intentionally kept neutral gray — color is reserved for BG-range semantics and the single primary blue accent
- Radius: `--radius` 22px (cards), `--radius-sm` 14px (inputs/small tiles)
- Fonts: "Plus Jakarta Sans" (UI text), "Space Grotesk" (headings/numbers), "Tajawal" (Arabic, loaded when `dir="rtl"`)

## Internationalization
`data.js` (`window.STRINGS`) has an English/Arabic dictionary covering navigation chrome. Only top-level nav/auth strings are translated in the prototype — screen body copy (food names, labels) is still English-only. A production build should extend full i18n coverage and RTL-test every screen (the prototype sets `dir="rtl"` + swaps to Tajawal font when Arabic is selected).

## Assets
No external image assets — icons are inline SVG or emoji glyphs (📅🩸🍎📋🧮👑), food data is text-only (name/portion/carbs), no photos.

## Files in this bundle
- `GlucoDose.html` — entry point / script load order
- `app.jsx` — root component, auth/session state, tab routing, tweaks (background theme + language)
- `components.jsx` — shared UI primitives
- `screens-auth.jsx`, `screens-onboarding.jsx`, `screens-dashboard.jsx`, `screens-calculator.jsx`, `screens-history.jsx`, `screens-subscription.jsx`, `screens-profile.jsx`
- `data.js` — food database, insulin/pill option lists, calculation helpers, translation strings
- `styles.css` — design tokens and global styles
- `tweaks-panel.jsx` — in-prototype design tweak panel (background theme, language) — not needed in production, reference only
