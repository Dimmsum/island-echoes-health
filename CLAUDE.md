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
docs/       REMAINING-GAPS-AUGUST.MD — single source of truth for what's left to build
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

- `index.ts` — Express setup, route mounting (routes are wired directly onto `app` in `index.ts`, not via per-domain `Router` files), error handlers
- `middleware/auth.ts` — `authMiddleware` (Bearer token validation → `req.user`/`req.accessToken` via the `AuthRequest` type)
- `middleware/requireRole.ts` — `requireAdmin`, `requireClinicianOrAdmin` (both re-check role by querying `profiles` with the user's own token, so RLS applies)
- `routes/` — one file per domain: `auth`, `me`, `home`, `appointments`, `sponsorship`, `stripe`, `wallet`, `clinician-portal`, `admin`, `clinician`, `profile`, `notifications`, `follow-ups`, `patient-status-updates`, `patient-conditions`, `medications`, `labs`, `patient-notes`
- `lib/stripe.ts` — Stripe helpers (`createSetupCheckoutSession`, etc.)
- `lib/supabase.ts` — `getUserFromToken`, `createSupabaseForUser` (user-scoped, RLS-enforced client) vs. a service-role client for privileged writes
- `lib/notifications.ts` — `createNotification`, `createNotificationOnce` (idempotent-per-day, used by the cron job below), `notifySponsorsOfPatient`

The API is the only process that should write to Supabase; the webapp and mobile clients read/write exclusively through the API (migration to this model is in progress — see [Migration status](#migration-status) below).

There is no scheduler inside `api/` (no cron, pg_cron, `setInterval`). `POST /api/jobs/follow-up-reminders` is mounted outside `authMiddleware` and instead gated by an `x-cron-secret` header matched against `CRON_SECRET` (503 if unset) — an external scheduler (e.g. Supabase `pg_cron`) must be wired to hit it daily.

### Webapp (`webapp/app/`)

Next.js App Router. Pages use server components to get the Supabase session/token, then call the API with that token. `lib/api.ts` contains the `fetchFromApi` / `fetchApiJson` helpers. Supabase's SSR client (`@supabase/ssr`) is used **only** to retrieve the session — data fetching goes through the API.

#### Migration status

`/home/*` pages are on the API. Clinician portal, auth flows, and some server actions still use direct Supabase queries — e.g. `webapp/app/clinician-portal/appointments/[id]/page.tsx` reads `patient_metrics` directly rather than through an API route.

### Mobile (`mobile/`)

Expo app. Entry point is `App.tsx` → `HomeRouter.tsx` which redirects to user or clinician navigator based on role. `lib/api.ts` is the shared fetch helper; Supabase auth token is retrieved from `lib/auth.ts` and attached to every request. NativeWind (Tailwind for RN) is used for styling.

### Roles

Four roles enforced at both RLS and API middleware level: `patient`, `sponsor`, `clinician`, `admin`. Clinicians require admin approval before their role is active.

### Payment model

The original 3-tier Stripe subscription model (Core Wellness / Chronic Care / Premium Coordination) has been replaced with a **wallet model** on both backend and web: each patient has a `patient_wallets` row; any user — including the patient themself, not just sponsors — can top up the wallet via `wallet_transactions` (`api/src/routes/wallet.ts` is role-agnostic). The single `sponsorship` row in `care_plans` exists only as an FK anchor. The `stripe_price_id`, `visits_per_month`, `features`, etc. columns have been dropped from `care_plans`. Mobile still calls a deleted sponsorship route and renders a stale 3-tier plan picker — see `docs/REMAINING-GAPS-AUGUST.MD` M1.3.

### Stripe

Setup-then-subscribe: Stripe Checkout in setup mode captures a payment method; on patient consent acceptance the API creates a subscription. Webhooks are verified by raw body + signature and deduplicated via `stripe_webhook_events`. `POST /api/wallet/topup/confirm` exists as a fallback for environments (e.g. localhost) where webhooks can't reach the API — don't assume production doesn't silently depend on it too.

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

Active work is tracked in `docs/REMAINING-GAPS-AUGUST.MD` — read it before picking up any feature work; it is the single source of truth and supersedes any priority list previously kept elsewhere. In short: most web-side roadmap priorities are shipped; **referral management is explicitly out of scope** (do not plan or build it); the milestone ladder there (M1–M7) covers what's left, led by a production-readiness gate (mobile sponsorship pointing at a deleted route, Clerk auth migration, etc.) and a mobile-parity gap (four web-shipped features — follow-ups, status updates, care continuity, structured notes — have no mobile UI yet).

## Additional Rules

1. For UI Screens when data is being loaded use skeleton screens.
2. For empty state, it should still render the card or whatever container present but it should say that there is nothing there. For example: No status updates.
