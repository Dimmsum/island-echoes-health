# Island Echoes Health — Work Progress Tracker

---

## Current Session

| Field | Value |
|---|---|
| **Last session date** | 2026-06-24 |
| **Current focus area** | Priority 8.4 — Structured Clinic Notes web |
| **Status** | Note form updated: `CustomSelect` for note type (general/coordination/clinical_summary/discharge), checkbox for flag-for-follow-up, conditional date input for due date. Note list shows note-type badge + "follow-up flagged" pill. `addAppointmentNote` server action switched from direct Supabase insert to API call so side-effects (auto-follow-up, coordination notification) fire. Notes SELECT updated in home API route + both page.tsx files. Both api/ and webapp/ builds clean. **00035 must be applied in Supabase before testing.** Next: 8.3 mobile (note type selector + flag toggle) or move to next priority. |

> Update this table at the start of each session.

---

## Session Log

| # | Date | Focus | Notes |
|---|---|---|---|
| 1 | 2026-06-23 | Priority 1.1 — Simplify care plans DB + add patient wallet | Migration 00030 written: dropped tier columns, single sponsorship seed, new patient_wallets + wallet_transactions tables with RLS |
| 2 | 2026-06-23 | Priority 1.2 — Backend: decouple consent, wallet API | New routes: POST /sponsorship/invite, GET+POST /wallet, GET /wallet/transactions. Removed create-payment + care-plans routes. Migration 00031: increment_wallet_balance fn. TypeScript build clean. |
| 3 | 2026-06-23 | Priority 1.3 — Web: wallet UI, remove pricing, update copy | Replaced /pricing with redirect. Removed Pricing nav link. Rewrote PurchasePlanForm → SupportPatientForm (email-only invite). Added WalletCard (balance + transactions + topup intent). Updated UserHome copy. Added wallet section to sponsored/[id] page. Build clean. |
| 4 | 2026-06-23 | Stripe top-up: full Elements flow + crediting fix | Wired full Stripe Elements payment (PaymentElement + confirmPayment) in WalletCard; added webapp/lib/stripe.ts singleton. Removed stale BillingPortalButton from UserHome + profile. Diagnosed: wallet only credited in webhook, which never reaches localhost (no Stripe CLI / no STRIPE_WEBHOOK_SECRET). Fix: migration 00032 (unique index on stripe_payment_intent_id + idempotent credit_wallet_topup fn); new POST /api/wallet/topup/confirm endpoint (verifies PI w/ Stripe, credits idempotently); webhook refactored to same RPC; frontend calls confirmTopup + router.refresh() after payment. Both builds clean. **Migration 00032 must be applied in Supabase.** |
| 5 | 2026-06-23 | Priority 2 re-scoped — recommendations direction | Decided: recommendations is a **live Google Places proxy**, not an owned/curated catalog (avoids implying endorsement); providers fetched by location + need. Ratings happen **off-platform on Google** (link out via `googleMapsUri`) — no in-app feedback. **2.1 is DB-less** (no `providers`/`provider_feedback` tables, no migration). Updated PROGRESS + PRODUCT_GAP_ANALYSIS. Next: 2.2 backend proxy. |
| 6 | 2026-06-23 | Priority 3.1 — Follow-up tracking DB | Migration 00033: `follow_up_status` enum (pending, completed, cancelled) + `follow_ups` table (patient_id, clinician_id, nullable appointment_id, due_date DATE, status, notes, completed_at) with RLS (patient/sponsor/clinician read; service-role writes). "Overdue" derived, not stored. Mirrors wallet table patterns from 00030. **00033 must be applied in Supabase.** |
| 7 | 2026-06-23 | Priority 3.2 — Follow-up tracking backend | New `api/src/routes/follow-ups.ts`: POST (clinician creates, validates patient + optional appointment link), GET (RLS-scoped list via user client, `?patientId`/`?status` filters, derived `overdue`), PATCH (owning-clinician/admin only, manages `completed_at`). Mounted 3 routes in `index.ts` behind authMiddleware (+requireClinicianOrAdmin on write). Build clean. |
| 8 | 2026-06-23 | Priority 3.4 — Follow-up tracking web | API-first web UI. New `follow-up-actions.ts` (server actions → `/api/follow-ups` via session token), `follow-up-types.ts`, `FollowUpsSection.tsx` (appointment-detail create/list + mark complete), `FollowUpsPanel.tsx` (dashboard open/overdue, clinician's own, overdue-first). Wired into clinician appointment-detail page/client + dashboard page/component. Build clean; no new lint errors. **3.3 mobile backlogged** at user request. |
| 9 | 2026-06-23 | Priority 6.1 — Patient status updates DB | Migration 00034: `status_update_visibility` enum (all, sponsor_only, patient_only) + `patient_status_updates` table (patient_id, created_by, status_text, visibility, created_at). Immutable/append-only (no updated_at), mirrors wallet_transactions ledger + follow_ups (00033) patterns. Visibility-aware RLS: patient reads own all/patient_only; linked sponsor (ended_at is null) reads all/sponsor_only; clinician reads all; service-role writes. **00034 must be applied in Supabase.** |
| 10 | 2026-06-23 | Priority 6.2 — Patient status updates backend | New `api/src/routes/patient-status-updates.ts`: POST (clinician/admin posts, validates target is a patient, visibility defaults 'all', service-role write) + GET (RLS-scoped user client so visibility views are enforced via the API — patient sees all/patient_only, linked sponsor sees all/sponsor_only, clinician sees all). Immutable: no PATCH/DELETE. Mounted at `/api/patients/:id/status-updates` in `index.ts` behind authMiddleware (+requireClinicianOrAdmin on POST). Mirrors follow-ups (3.2). Build clean. |
| 11 | 2026-06-23 | Priority 6.4 — Patient status updates web | API-first web UI mirroring follow-ups (3.4). New `status-update-types.ts`, `status-update-actions.ts` (server action → `/api/patients/:id/status-updates`), `appointments/[id]/StatusUpdatesSection.tsx` (clinician post form w/ visibility selector + list w/ visibility badge). Wired into appointment-detail page/client. Sponsor read-only status feed added to `home/sponsored/[id]/page.tsx` (fetches via sponsor token; RLS returns all/sponsor_only). Build clean; no new lint errors. Patient self-view + 6.3 mobile out of scope. |
| 12 | 2026-06-24 | Priority 7.1 — Care continuity dashboard backend | New `GET /api/clinician-portal/care-continuity`: queries all patients (admin client), last completed/no_show appointment, pending follow_ups; returns per-patient `patientId/Name/Avatar/lastAppointmentDate/daysSinceLastAppointment/openFollowUpsCount/overdueFollowUpsCount`. Extended `GET /api/home/sponsored/:id` with `careSummary` block (lastVisitDate, daysSinceLastVisit, nextAppointmentDate, openFollowUpsCount, overdueFollowUpsCount, recentStatusUpdates — user-client for RLS-scoped status visibility). No migration. Build clean. Pending referral count deferred to Priority 5. |
| 13 | 2026-06-24 | Priority 7.4 — Care continuity dashboard web | New `CareContinuityPanel.tsx` on clinician portal dashboard: filters patients with `daysSinceLastAppointment >= 30 || overdueFollowUpsCount > 0`, sorts overdue first, shows "all clear" empty state. Fetched via parallel Promise.allSettled in page.tsx. Sponsor view (`home/sponsored/[id]`): added `careSummary` type block, rendered as 3-column card (last visit · next appointment · follow-ups) between stats row and vitals. Build clean. |
| 14 | 2026-06-24 | Priority 8.1 — Structured clinic notes DB | Migration 00035: `note_type` enum (`general`, `coordination`, `clinical_summary`, `discharge`); `appointment_notes.note_type` column converted from text → enum; `flag_for_follow_up boolean default false` added; SELECT RLS policy updated to block sponsors from `coordination` notes (clinician-internal). **00035 must be applied in Supabase.** |
| 15 | 2026-06-24 | Priority 8.2 — Structured clinic notes backend | `addNote()` updated to accept `note_type` + `flag_for_follow_up` + `followUpDueDate`; validates note type; fetches appointment for `patient_id`; auto-creates follow-up via admin client; notifies admins on coordination notes via new `notifyAdmins()` in `lib/notifications.ts`. Migration 00035 amended to add `coordination_note` to `notification_type` enum. Build clean. |
| 16 | 2026-06-24 | Priority 8.4 — Structured clinic notes web | Note form: `CustomSelect` for note type, checkbox for flag-for-follow-up, conditional date input. Note list: type badge + "follow-up flagged" pill. `addAppointmentNote` server action switched from direct Supabase insert to API call. Notes SELECT updated in home API route + both page.tsx files. `Note` type updated in both `AppointmentDetailClient.tsx` files. Both builds clean. |

> Add a row each session. Example: `| 1 | 2026-06-22 | Priority 1 — Remove care plan tiers | Completed DB migration, updated LinkPatientScreen |`

---

## Action Items

Items are ordered by the recommended priority from the gap analysis. Check off each item as it is completed. Sub-items represent discrete implementation steps (DB → API → UI).

---

### Priority 1 — Remove Care Plan Tiers & Simplify Payment
> Collapse 3-tier care plan model into a single sponsorship option. Retain ability for sponsors AND patients to pay.

- [x] **1.1 — Database**
  - [x] Write migration to deprecate/remove tier-specific columns (`visits_per_month`, `chronic_labs_per_quarter`, `features` array, `stripe_price_id`) from `care_plans`
  - [x] Decided on wallet model (no fixed amount); seeded single `sponsorship` row with price_cents=0
  - [x] Added `patient_wallets` and `wallet_transactions` tables with RLS policies
  - [x] Fixed `idx_sponsor_patient_plans_unique_active` to drop `care_plan_id` from the index
  - Migration: `supabase/migrations/00030_simplify_care_plans_and_add_wallet.sql`

- [x] **1.2 — Backend**
  - [x] Replaced `POST /api/sponsorship/create-payment` with `POST /api/sponsorship/invite` (consent decoupled from Stripe)
  - [x] Removed `getOrCreatePriceForCarePlan()`, `createSetupCheckoutSession()`, subscription logic from `acceptConsent`
  - [x] Removed `GET /api/care-plans` route and deleted `care-plans.ts`
  - [x] Added wallet routes: `GET /api/wallet`, `POST /api/wallet/topup/intent`, `GET /api/wallet/transactions`
  - [x] Added `createWalletTopupIntent()` to `lib/stripe.ts`
  - [x] Added wallet top-up webhook branch in `handleStripeWebhook` (`payment_intent.succeeded` with `metadata.type=wallet_topup`)
  - [x] Migration 00031: `increment_wallet_balance` Postgres function for atomic balance updates

- [x] **1.3 — Web**
  - [x] Remove `PurchasePlanForm` plan-tier selector (rewritten as `SupportPatientForm` — email only, calls `/api/sponsorship/invite`)
  - [x] Remove `/pricing` page (redirects to `/home`)
  - [x] Update sponsorship UI copy ("Support a family member / another patient")
  - [x] Added `WalletCard` component — balance, top-up intent, recent transactions
  - [x] Updated `home/page.tsx` to fetch wallet data from `GET /api/wallet` + `GET /api/wallet/transactions`
  - [x] Added wallet section to `/home/sponsored/[id]` (sponsor can see patient wallet + add funds)
  - [x] Removed `$X/month` price badge from sponsored patient hero card

- [ ] **1.4 — Mobile**
  - [ ] Remove care plan dropdown from `LinkPatientScreen`
  - [ ] Update home screen CTA copy (from "Sponsor a care plan" → family support framing)

---

### Priority 2 — Healthcare Recommendations
> A trusted healthcare **navigation** experience: users find clinics, specialists, mental-health providers, pharmacies, labs, and wellness resources **based on their location and what they need help with**.
>
> **Direction (re-scoped 2026-06-23):** Providers are fetched **live from the Google Places API**, not stored in an owned/curated catalog — we don't want to imply we endorse a hand-picked list. Ratings/reviews happen **off-platform on Google**; we surface each provider's Google rating and a "view / rate on Google" link (`googleMapsUri`). No in-app feedback, no owned provider data.

- [x] **2.1 — Database** — **DB-less, no migration.** Providers come live from Google Places; ratings are off-platform. No `providers` or `provider_feedback` tables are created. (Superseded the original owned-catalog + in-app-feedback sketch.)

- [ ] **2.2 — Backend** (Google Places proxy)
  - [ ] `GET /api/recommendations/search` — query Google Places by `lat`, `lng`, `category`/`q`, `radius`; return normalized providers (name, address, location, rating, `googleMapsUri`, phone, website)
  - [ ] `GET /api/recommendations/:placeId` — Place Details passthrough (normalized provider detail)
  - [ ] New `api/src/lib/googlePlaces.ts` client (native fetch, mirrors `lib/stripe.ts`) with a healthcare-category → Google-query/type map (clinic, mental_health, specialist, pharmacy, diagnostic, wellness)
  - [ ] Add `GOOGLE_PLACES_API_KEY` env var (API only); guard unconfigured with 503
  - [ ] Mount both routes in `index.ts` behind `authMiddleware`

- [ ] **2.3 — Mobile**
  - [ ] Add Recommendations tab to `UserTabsNavigator`
  - [ ] Build `RecommendationsScreen` — search bar + category filter chips, consumes `/api/recommendations/search`
  - [ ] Build `ProviderDetailScreen` — info + Google rating + **"View / rate on Google"** link (opens `googleMapsUri`) + "Request referral" CTA
  - [ ] Add location filter UI (uses device location / lat-lng input)

- [ ] **2.4 — Web**
  - [ ] Create `/recommendations` page — search + filters, consumes `/api/recommendations/search`
  - [ ] Create `/recommendations/[id]` page — provider detail with Google rating + "View / rate on Google" link out

---

### Priority 3 — Follow-up Tracking
> Standalone follow-up tasks, not just a tag on appointments.

- [x] **3.1 — Database**
  - [x] Create `follow_up_status` enum (pending, completed, cancelled) — "overdue" is **derived** (`status='pending' AND due_date < current_date`), not a stored status, so no background job is needed
  - [x] Create `follow_ups` table (id, patient_id, clinician_id, appointment_id nullable, due_date [DATE], status, notes, created_at, updated_at, completed_at)
  - [x] Add RLS policies (patient reads own; sponsor reads linked patient's; clinician reads all; service role manages writes — mirrors `patient_wallets`)
  - Migration: `supabase/migrations/00033_follow_ups.sql` (**must be applied in Supabase**)

- [x] **3.2 — Backend**
  - [x] `POST /api/follow-ups` — clinician/admin creates follow-up (validates target is a patient; optional appointment link must match patient)
  - [x] `GET /api/follow-ups` — list via RLS-scoped user client (patient sees own; clinician sees all; sponsor sees linked patient's); `?patientId`/`?status` filters; response includes derived `overdue`
  - [x] `PATCH /api/follow-ups/:id` — update status/notes; owning-clinician or admin only; auto-manages `completed_at`
  - [x] Writes use service-role client (no authenticated-write RLS policy); routes mounted in `index.ts` behind `authMiddleware` (+`requireClinicianOrAdmin` on POST/PATCH)
  - File: `api/src/routes/follow-ups.ts`

- [ ] **3.3 — Mobile** — **backlogged** (deferred at user request 2026-06-23)
  - [ ] Add "Add follow-up" action on `ClinicianAppointmentDetailScreen`
  - [ ] Add follow-up section to patient home screen (pending items)
  - [ ] Surface overdue follow-ups on clinician dashboard

- [x] **3.4 — Web** — API-first (server actions → `/api/follow-ups`)
  - [x] Add follow-up creation flow to appointment detail page (`FollowUpsSection` — create form + list + mark complete, prefilled with patient + appointment)
  - [x] Add follow-ups panel to clinician portal dashboard (`FollowUpsPanel` — clinician's own open follow-ups, overdue-first, quick complete)
  - Files: `webapp/app/clinician-portal/follow-up-actions.ts`, `follow-up-types.ts`, `appointments/[id]/FollowUpsSection.tsx`, `FollowUpsPanel.tsx`

- [ ] **3.5 — Notifications**
  - [ ] Add `follow_up_due` and `follow_up_overdue` to `notification_type` enum
  - [ ] Wire notification triggers (on creation and on overdue)

---

### Priority 4 — Patient Self-Pay
> Patients currently cannot pay for their own care. Sponsors are the only payers.

- [ ] **4.1 — Backend**
  - [ ] Add patient-initiated payment route (Stripe checkout from patient role)
  - [ ] Handle patient as both payer and recipient (no consent request needed)

- [ ] **4.2 — Mobile**
  - [ ] Add "Pay for my own care" option on user home screen
  - [ ] Build self-pay checkout flow

- [ ] **4.3 — Web**
  - [ ] Add self-pay entry point on user dashboard

---

### Priority 5 — Referral Management
> Depends on Priority 2 (provider directory) being in place first.

- [ ] **5.1 — Database**
  - [ ] Create `referral_status` enum (created, sent, accepted, completed)
  - [ ] Create `referrals` table (id, patient_id, referring_clinician_id, provider_id nullable, provider_name_free_text, reason, status, created_at, updated_at)
  - [ ] Add RLS policies

- [ ] **5.2 — Backend**
  - [ ] `POST /api/referrals` — clinician creates referral
  - [ ] `GET /api/referrals` — patient/clinician/sponsor views (role-scoped)
  - [ ] `PATCH /api/referrals/:id/status` — update referral status

- [ ] **5.3 — Mobile**
  - [ ] Add "Create referral" action on `ClinicianPatientDetailScreen`
  - [ ] Add "My referrals" section to patient home screen
  - [ ] Sponsor: show referral status on sponsored patient detail

- [ ] **5.4 — Web**
  - [ ] Referral creation from clinician portal patient view
  - [ ] Referral status display for patient/sponsor

- [ ] **5.5 — Notifications**
  - [ ] Add `referral_update` to `notification_type` enum
  - [ ] Trigger notification on referral status change

---

### Priority 6 — Patient Status Updates
> Clinician-posted updates visible to patients and family sponsors.

- [x] **6.1 — Database**
  - [x] Create `status_update_visibility` enum (all, sponsor_only, patient_only)
  - [x] Create `patient_status_updates` table (id, patient_id, created_by, status_text, visibility, created_at) — immutable/append-only, no `updated_at`
  - [x] Add visibility-aware RLS policies (patient reads own all/patient_only; linked sponsor reads all/sponsor_only; clinician reads all; service-role writes — backend enforces clinician/admin role)
  - Migration: `supabase/migrations/00034_patient_status_updates.sql` (**must be applied in Supabase**)

- [x] **6.2 — Backend**
  - [x] `POST /api/patients/:id/status-updates` — clinician/admin posts update (validates target is a patient; visibility defaults to `all`; service-role write)
  - [x] `GET /api/patients/:id/status-updates` — reads via RLS-scoped user client so the visibility views are enforced through the API (patient sees `all`/`patient_only`; linked sponsor sees `all`/`sponsor_only`; clinician sees all)
  - [x] Immutable feed — no PATCH/DELETE; routes mounted in `index.ts` behind `authMiddleware` (+`requireClinicianOrAdmin` on POST)
  - File: `api/src/routes/patient-status-updates.ts`

- [ ] **6.3 — Mobile**
  - [ ] Add "Post status update" action on `ClinicianPatientDetailScreen`
  - [ ] Add status feed to user home / sponsored patient detail screen

- [x] **6.4 — Web** — API-first (server action → `/api/patients/:id/status-updates`)
  - [x] Status update post UI in clinician portal (`StatusUpdatesSection` on appointment-detail page — post form with visibility selector all/sponsor_only/patient_only + list with visibility badge + mark via `router.refresh()`)
  - [x] Status feed in sponsored patient detail view (read-only feed on `/home/sponsored/[id]`; fetched with sponsor token so RLS returns only `all`/`sponsor_only`)
  - [x] Patient self-view on `/home` deferred (out of scope this step, at user request)
  - Files: `webapp/app/clinician-portal/status-update-actions.ts`, `status-update-types.ts`, `appointments/[id]/StatusUpdatesSection.tsx`, edits to `appointments/[id]/page.tsx` + `AppointmentDetailClient.tsx` + `home/sponsored/[id]/page.tsx`

- [ ] **6.5 — Notifications**
  - [ ] Add `patient_status_update` to `notification_type` enum
  - [ ] Trigger notification to patient and linked sponsors on new update

---

### Priority 7 — Care Continuity Dashboard
> Depends on Priority 3 (follow-ups) and Priority 6 (status updates) being in place.

- [x] **7.1 — Backend**
  - [x] New `GET /api/clinician-portal/care-continuity` — per-patient: last appointment date, days since last appointment, open + overdue follow-up counts (pending referral count deferred to Priority 5)
  - [x] Extended `GET /api/home/sponsored/:id` — added `careSummary` block: last visit date, days since last visit, next appointment date, open/overdue follow-up counts, recent status updates (RLS-scoped)
  - Files: `api/src/routes/clinician-portal.ts`, `api/src/routes/home.ts`, `api/src/index.ts`

- [ ] **7.2 — Mobile (Clinician)**
  - [ ] Rework `ClinicianDashboardScreen` to lead with care gaps
  - [ ] Add "patients not seen in 30+ days" list
  - [ ] Surface overdue follow-ups and pending referrals

- [ ] **7.3 — Mobile (Sponsor/Family)**
  - [ ] Add "Care Summary" card per linked patient on user home
  - [ ] Show: last visit date, next appointment, open follow-ups, any alerts

- [x] **7.4 — Web**
  - [x] `CareContinuityPanel.tsx` on clinician portal dashboard — patients not seen in 30+ days or with overdue follow-ups, sorted by urgency, "all clear" empty state, links to appointments
  - [x] Care Summary card on `/home/sponsored/[id]` — last visit date + days ago, next appointment, open/overdue follow-up counts
  - Files: `webapp/app/clinician-portal/CareContinuityPanel.tsx`, edits to `clinician-portal/page.tsx`, `ClinicianPortalDashboard.tsx`, `home/sponsored/[id]/page.tsx`

---

### Priority 8 — Structured Clinic Notes & Coordination Workflows
> Enhance existing appointment notes with structure and coordination triggers.

- [x] **8.1 — Database**
  - [x] Create `note_type` enum (`general`, `coordination`, `clinical_summary`, `discharge`) — converts existing text column
  - [x] Added `flag_for_follow_up boolean default false` to `appointment_notes`
  - [x] Updated SELECT RLS: sponsors blocked from `coordination` notes; all other roles unaffected
  - Migration: `supabase/migrations/00035_structured_clinic_notes.sql` (**must be applied in Supabase**)

- [x] **8.2 — Backend**
  - [x] Updated `POST /api/appointments/:id/notes`: accepts `note_type` (validated enum, default `general`), `flag_for_follow_up` (bool), `followUpDueDate` (optional)
  - [x] Auto-creates `follow_ups` row via service-role client when `flag_for_follow_up=true`
  - [x] Triggers `coordination_note` notification to all admins when `note_type=coordination`
  - [x] Added `notifyAdmins()` helper to `api/src/lib/notifications.ts`
  - [x] Migration 00035 amended: `coordination_note` added to `notification_type` enum

- [ ] **8.3 — Mobile**
  - [ ] Add note type selector (General / Clinical Summary / Coordination / Discharge) to note creation UI
  - [ ] Add "Flag for follow-up" toggle on coordination notes (auto-creates a follow-up task)

- [x] **8.4 — Web**
  - [x] Note type selector (`CustomSelect`: general / coordination / clinical_summary / discharge) on note form
  - [x] "Flag for follow-up" checkbox; conditional follow-up due date input when checked
  - [x] Note list: type badge + "follow-up flagged" pill per note
  - [x] `addAppointmentNote` server action switched to API call (auto-follow-up + coordination notification now fire)
  - [x] Notes SELECT expanded to include `note_type, flag_for_follow_up` in home API route + both page.tsx files
  - Files: `webapp/app/home/appointments/[id]/AppointmentDetailClient.tsx`, `webapp/app/home/clinician-actions.ts`, `webapp/app/home/appointments/[id]/page.tsx`, `webapp/app/clinician-portal/appointments/[id]/AppointmentDetailClient.tsx` + `page.tsx`, `api/src/routes/home.ts`

---

## Completed

> Move items here (copy the checkbox line) once fully shipped and tested.

- Nothing completed yet.

---

## Deferred / Decisions Pending

> Items that are blocked on a product decision before work can begin.

| Item | Blocker |
|---|---|
| 1.1 — Single sponsorship amount | **Resolved**: wallet model — no fixed amount; any user tops up patient's wallet |
| 2.1 — Provider seeding | **Resolved**: no seeding — providers are fetched live from Google Places, not stored/curated by us. Ratings are off-platform on Google. |
| 2.2 — External provider API | **Resolved**: Google Places API. Requires a Google Cloud key (`GOOGLE_PLACES_API_KEY`) with the Places API enabled + billing. |

