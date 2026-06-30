# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Repository Layout

Monorepo with three applications sharing a single Supabase (PostgreSQL) backend:

```
api/        Express + TypeScript backend — all business logic lives here
webapp/     Next.js 15 (App Router) web client
mobile/     Expo / React Native mobile client
supabase/   migrations/ — sequential numbered SQL migrations (00001…)
docs/       API-MIGRATION.md, STRIPE.md — architecture decisions
```

---

## Commands

### API (`api/`)

```bash
npm run dev       # tsx watch (development, port 4001)
npm run build     # tsc → dist/
npm start         # run compiled server
```

### Web (`webapp/`)

```bash
npm run dev       # Next.js dev server, port 3000
npm run build     # production build
npm run lint      # ESLint
```

### Mobile (`mobile/`)

```bash
npm start         # Expo dev server
npm run ios       # run on iOS simulator
npm run android   # run on Android emulator
npm run lint      # ESLint + Prettier check
npm run format    # auto-fix lint + format
```

### Database

Migrations live in `supabase/migrations/` numbered `00001_…`, `00002_…` etc. Apply via Supabase dashboard SQL editor or `supabase db push`. New migrations must follow the `NNNNN_slug.sql` naming convention and be written to be idempotent where possible (use `IF NOT EXISTS`, `DROP … IF EXISTS` guards).

---

## Architecture

### Auth model

Supabase Auth is the identity source. Every client authenticates with Supabase to obtain a JWT access token, then sends `Authorization: Bearer <token>` to the API. The API validates the token against Supabase using the service role key, then serves data through its own Supabase client. Row-level security (RLS) is enabled on every table as a defence-in-depth layer, but the API is the primary enforcement point.

### API structure (`api/src/`)

- `index.ts` — Express setup, route mounting, error handlers
- `middleware/` — `authMiddleware` (Bearer validation → `req.user`), `requireAdmin`, `requireClinicianOrAdmin`
- `routes/` — one file per domain: `auth`, `me`, `home`, `appointments`, `sponsorship`, `stripe`, `clinician-portal`, `admin`, `clinician`, `profile`, `notifications`, `care-plans`
- `lib/stripe.ts` — Stripe helpers (`createSetupCheckoutSession`, `getOrCreatePriceForCarePlan` — the latter is being removed as part of Priority 1)

The API is the only process that should write to Supabase; the webapp and mobile clients read/write exclusively through the API (migration to this model is in progress — see `docs/API-MIGRATION.md`).

### Webapp (`webapp/app/`)

Next.js App Router. Pages use server components to get the Supabase session/token, then call the API with that token. `lib/api.ts` contains the `fetchFromApi` / `fetchApiJson` helpers. Supabase's SSR client (`@supabase/ssr`) is used **only** to retrieve the session — data fetching goes through the API.

Migration status: `/home/*` pages are on the API. Clinician portal, auth flows, and server actions still use direct Supabase queries (Steps 2–4 in `docs/API-MIGRATION.md`).

### Mobile (`mobile/`)

Expo app. Entry point is `App.tsx` → `HomeRouter.tsx` which redirects to user or clinician navigator based on role. `lib/api.ts` is the shared fetch helper; Supabase auth token is retrieved from `lib/auth.ts` and attached to every request. NativeWind (Tailwind for RN) is used for styling.

### Roles

Four roles enforced at both RLS and API middleware level: `patient`, `sponsor`, `clinician`, `admin`. Clinicians require admin approval before their role is active.

### Payment model

The original 3-tier Stripe subscription model (Core Wellness / Chronic Care / Premium Coordination) is being replaced with a **wallet model**: each patient has a `patient_wallets` row; any user can top up the wallet via `wallet_transactions`. The single `sponsorship` row in `care_plans` exists only as an FK anchor during the transition. The `stripe_price_id`, `visits_per_month`, `features`, etc. columns have been dropped.

### Stripe

Setup-then-subscribe: Stripe Checkout in setup mode captures a payment method; on patient consent acceptance the API creates a subscription. Webhooks are verified by raw body + signature and deduplicated via `stripe_webhook_events`. See `docs/STRIPE.md` for the full flow.

---

## Environment variables

Each app has its own `.env`. Key variables:

| Variable                                                     | Used in                              |
| ------------------------------------------------------------ | ------------------------------------ |
| `SUPABASE_SERVICE_ROLE_KEY`                                  | API only — never expose to clients   |
| `STRIPE_SECRET_KEY`                                          | API only                             |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | webapp + mobile                      |
| `EXPO_PUBLIC_API_URL`                                        | mobile → points to API               |
| `API_URL`                                                    | webapp (server-side) → points to API |

---

## Product direction

Active work is tracked in `webapp/PROGRESS.md`. Priority order:

1. **Remove care plan tiers / simplify payment** (DB done, backend + UI pending)
2. **Healthcare provider recommendations directory** (not yet started)
3. **Follow-up tracking** (standalone tasks, not appointment tags)
4. **Patient self-pay** (currently only sponsors can pay)
5. **Referral management** (depends on provider directory)
6. **Patient status updates** (clinician → family view)
7. **Care continuity dashboard** (depends on 3 + 6)
8. **Structured clinic notes** (coordination workflows)

## Additional Rules

1. For UI Screens when data is being loaded use skeleton screens.
2. For empty state, it should still render the card or whatever container present but it should say that there is nothing there. For example: No status updates.
