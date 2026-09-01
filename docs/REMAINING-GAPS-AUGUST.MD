# Island Echoes Health — Remaining Work

> **Date:** 2026-08-31
> **Status:** Single source of truth for what is left to build.
> **Supersedes:** `PRODUCT_GAP_ANALYSIS.md`, `PROGRESS.md`, `PATIENT-PAGE-DATA-GAPS.md`,
> `PATIENT-METRICS-HEART-RATE-TEMP-IMPLEMENTATION.md` (all deleted — their content is
> folded in below), and the stakeholder briefing artifact of 2026-08-26.
>
> Every claim here was verified against the codebase on 2026-08-31, not carried over
> from the retired docs. Where the old docs were wrong, see **[Correcting the record](#correcting-the-record)**.

---

## Where things stand

The core product works end to end. Patients, family sponsors, clinicians and admins all
have functioning accounts; appointments are booked and managed; family members fund a
patient's care through a wallet. A focused push in late June shipped four significant
web features back to back.

**5 of the 7 remaining roadmap priorities are complete on web.**

Two remain: **provider recommendations** (not started, and now 🚫 **blocked on a spend
decision** — every data source that gives us the experience we want costs money, see M3) and
**patient self-pay** (backend + web are actually done — only mobile is left). Referral
management, previously counted as an eighth, is **out of scope** — see below.

Separately, the mobile app is **four features behind web**. Of the three production-readiness
blockers, two are cleared as of 2026-08-31 — migrations `00033`–`00036` are confirmed applied
(M1.1) and the `/api/home` care-plan bug is fixed (M1.2). **One live bug remains**: mobile
sponsorship still calls a deleted route (M1.3).

| | Web | Mobile |
|---|---|---|
| Auth, roles, appointments, clinician portal | ✅ | ✅ |
| Wallet payments (tiers removed) | ✅ | ❌ **broken** — see M1.3 |
| Follow-up tracking | ✅ | ❌ |
| Patient status updates | ✅ | ❌ |
| Care continuity dashboard | ✅ | ❌ |
| Structured clinic notes | ✅ | ❌ |
| Patient self-pay | ✅ | ❌ |
| Provider recommendations | 🚫 blocked | 🚫 blocked |

---

## Explicitly out of scope: referral management

**Referral management is dropped. Do not plan or build it.**

Nothing exists to delete — there is no `referrals` table, route, or component anywhere in
the codebase. What remains is stale *references* that should be cleaned up (tracked as **M2**):

| Location | What to remove |
|---|---|
| `mobile/components/onboarding/OnboardingRoleSelect.tsx` | User-facing copy promising referrals |
| `mobile/components/onboarding/OnboardingFeature.tsx` | Same |
| `mobile/components/clinician/clinicianMockData.ts:232` | "retinal screening referral status" in mock note text (cosmetic) |
| Stakeholder briefing artifact | Roadmap count should read **5 / 7**, not 5 / 8; "What's ahead" drops from three items to two |
| `docs/PRODUCT_GAP_ANALYSIS.md` §2.5/§3.3/§5, `docs/PROGRESS.md` Priority 5 | Removed with those files |

One consequence to record: `api/src/routes/clinician-portal.ts`'s care-continuity response
omits a pending-referral count, previously noted as "deferred to Priority 5". **That omission
is now permanent and intentional**, not a pending gap.

---

## Shipped so far

| Phase | What landed |
|---|---|
| **Feb 2026** — Foundation | Accounts, profiles, roles, notifications, first working appointments + clinician approval flow |
| **Mar–May 2026** — Payments & mobile | Stripe integration, mobile app build-out, clinician portal with patient detail and metrics |
| **Late Jun 2026** — The web push | Five priorities back to back: wallet payments (3-tier care plans removed, migrations `00030`–`00032`), follow-up tracking (`00033`), patient status updates (`00034`), care continuity dashboard, structured clinic notes (`00035`) |
| **Aug 2026** — Launch prep | Production hosting fixes, brand refinement, appointment booking fields (`00036`), patient detail page (`/patients`) with vitals charting |

---

## Milestone ladder

Ordered by *unblocks-others*, then by effort. **M1 is the answer to "what next".**

| # | Milestone | Depends on | Size |
|---|---|---|---|
| **M1** | Production readiness gate (M1.1 ✅, M1.2 ✅, M1.5 ⏸️) | — | S |
| **M2** | Drop referral management | — | XS |
| **M3** | Provider recommendations | 🚫 **blocked — spend decision** | L |
| **M4** | Patient self-pay — finish | M1.3 | S |
| **M5** | Notification coverage | M1.1 | S |
| **M6** | Patient page data gaps | M1.1 | M–L |
| **M7** | Mobile parity | M1.3 | L |

---

### M1 — Production readiness gate

Nothing below is trustworthy until this is green. Two of these are live bugs.
**Status: M1.1 ✅, M1.2 ✅ — M1.3, M1.4, M1.5 remain.**

- ~~**M1.1 — Verify/apply migrations `00033`, `00034`, `00035`, `00036` in Supabase.**~~
  ✅ **Done (2026-08-31).** Migrations confirmed applied in Supabase. The milestones below
  can now assume `follow_ups`, `patient_status_updates`, `appointment_notes` and the
  appointment booking fields are live.

- ~~**M1.2 — Fix `api/src/routes/home.ts:54`.**~~
  ✅ **Done (2026-08-31).** It selected `care_plans.features`, a column dropped by
  `00030_simplify_care_plans_and_add_wallet.sql`. PostgREST rejected the unknown column, so
  `carePlansRes` errored and silently fell back to `[]` at line 60 — every `care_plan`
  object on `GET /api/home` resolved to `null`. The select is now
  `id, slug, name, price_cents`, matching the other `care_plans` reads in the file.
  Note: `mobile/lib/userHome.ts:37` still declares an optional `features` field and
  `mobile/components/user/LinkPatientScreen.tsx:103` still reads it — that plan picker is
  removed as part of **M1.3**, so it is left alone here.

- **M1.3 — Fix mobile sponsorship (404 today).** `mobile/lib/sponsorship.ts:16`
  (`createPaymentForPlanMobile`) posts to `/api/sponsorship/create-payment`, a route deleted
  when the wallet model landed. `mobile/components/user/LinkPatientScreen.tsx:32,99` still
  renders the removed 3-tier care plan picker. Fix: repoint to `POST /api/sponsorship/invite`
  (email only, no `carePlanId`) and strip the plan selector. This closes the orphaned
  "Priority 1.4 — Mobile" item.

- **M1.4 — Verify Stripe end to end in the deployed environment.** Confirm
  `STRIPE_WEBHOOK_SECRET` is set and `payment_intent.succeeded` actually reaches
  `handleStripeWebhook`. `POST /api/wallet/topup/confirm` exists as a fallback added because
  webhooks never reached localhost — confirm production is not silently depending on it.

- **M1.5 — Provider API key — ⏸️ on hold, folded into the M3 blocker.** Previously
  "provision `GOOGLE_PLACES_API_KEY`", justified by procurement lead time. That rationale is
  gone: the preferred source is now Geoapify (`GEOAPIFY_API_KEY`), which is self-serve with no
  lead time, and the vendor choice is part of the unresolved M3 spend decision. Nothing to
  procure until M3 is unblocked — **M3 no longer depends on M1.5.**

---

### M2 — Drop referral management

Execute the scrub table in [Explicitly out of scope](#explicitly-out-of-scope-referral-management).
Roughly 20 lines of mobile onboarding copy plus one mock string. Record the decision so the
care-continuity endpoint's missing referral count reads as intentional to the next reader.

---

### M3 — Provider recommendations — 🚫 **BLOCKED: needs a spend decision**

The one remaining major user-facing feature. Zero implementation exists today — the only
repo-wide hit for "recommendation" is a string in mobile mock data.

**Blocked as of 2026-08-31.** Not blocked on engineering — the build is well understood and
small. Blocked because every source that delivers the experience we actually want carries a
recurring per-search cost, and nobody has approved a budget line for it. **Do not start M3
until the spend question below is answered.** Research backing this is recorded in
[Provider data source options](#provider-data-source-options).

**Scope note (2026-08-31):** the app is **not** Jamaica-specific and must not be designed as
if it were. The current `profiles.parish` dropdown reflects one launch market, not the
product's reach. Provider search must be **country-agnostic** — driven by coordinates and
radius, with no hardcoded country — or M3 becomes a rewrite the first time a second market
opens. This rules out the otherwise attractive option of seeding a catalog from a national
health-ministry facility registry, which does not generalize.

**Original direction (settled 2026-06-23), now in question:** providers fetched **live from
Google Places**, never stored in an owned catalog — we don't want to imply we endorse a
hand-picked list. Ratings and reviews stay **off-platform on Google**; we surface each
provider's Google rating and a "view / rate on Google" link (`googleMapsUri`). No in-app
feedback. **No migration.**

The cost problem is that this direction, as written, lands on Google's **most expensive**
configuration and forbids the one optimization that would contain it:

- Places API (New) bills at the **highest SKU tier among the fields you request**. Text
  Search / Nearby Search alone is Pro at **$32 per 1,000 calls**. Asking for `rating` — which
  the spec above explicitly does — promotes the call to **Enterprise, $35 per 1,000**; adding
  reviews or other atmosphere fields makes it **$40 per 1,000**.
- Free allowance is **per SKU and small**: 10,000 calls/month for Essentials, 5,000 for Pro,
  **1,000 for Enterprise**. The old flat $200/month credit was withdrawn and no longer exists.
- **Results may not be cached or stored.** Only `place_id` may be retained indefinitely; every
  name, phone, address and rating must be re-fetched live on each view. So the bill scales
  linearly with usage forever and there is **no engineering fix** — we cannot cache our way out.

Indicative monthly cost at the specced Enterprise tier, search traffic only, before any
detail-view calls:

| Searches / month | Billable | Google (rating field, no caching allowed) |
|---|---|---|
| 10,000 | 9,000 | **~$315** |
| 50,000 | 49,000 | **~$1,715** |
| 100,000 | 99,000 | **~$3,465** |

**The decision needed.** The feature splits cleanly into a part that is free and a part that
is not, and they can be shipped separately:

| Piece | Cost | Status |
|---|---|---|
| Provider discovery — search, categories, address, phone, website, map location | **~$0–59/mo** | Fundable, see options below |
| "View / rate on Google" link-out | **$0** | Google Maps URLs (`api=1` deep links) need no API key, no quota, no billing |
| **Numeric Google rating shown in-app** | **$35 per 1,000 searches, uncacheable** | 🚫 **This is the blocker** |

Only the third row requires Google money. The link-out that the 2026-06-23 direction actually
cares about — keeping ratings and reviews off-platform and sending users to Google to read and
leave them — **is free**, and works against a provider record from any source.

**Recommendation to put to whoever owns the budget:** ship discovery + free Google link-out,
and treat the in-app numeric rating badge as a paid enhancement to switch on later behind a
flag. That delivers essentially the specced UX for roughly $59/month instead of hundreds to
thousands, and keeps the door open. If the numeric rating is judged essential to launch, that
is a legitimate call — it just needs an approved budget line, and it should be understood as a
permanent recurring cost that grows with adoption, not a one-off.

**Preferred approach once unblocked** (chosen 2026-08-31, pending the cost decision above):
a live third-party places API — **Geoapify** as primary. It is country-agnostic, and unlike
Google it **permits storing and caching results**, so repeat searches cost nothing. Free tier
is 3,000 credits/day but is limited-commercial; the first commercial tier is **$59/month flat**
for 10,000 credits/day (~300,000/month). HERE is the fallback if volume outgrows that — a
larger 250,000/month free tier, but its terms cap retention at 30 days and forbid building a
repository, so it is the weaker licence.

Implementation sketch, unchanged in shape from the original plan — swap the vendor, keep the
structure:

- **M3.1 — `api/src/lib/geoapify.ts`** (was `googlePlaces.ts`). Native `fetch`, mirroring the
  module shape of `api/src/lib/stripe.ts` (`isGeoapifyConfigured()` / throw-on-missing-key, per
  `getStripe`/`isStripeConfigured`). Map our healthcare categories onto Geoapify's
  `healthcare.hospital`, `healthcare.clinic_or_praxis`, `healthcare.pharmacy`,
  `healthcare.dentist`. Return 503 when the key is unset. Add a small in-process TTL cache —
  permitted by the licence, and what keeps the bill flat.
- **M3.2 — Routes.** `GET /api/recommendations/search` (`lat`, `lng`, `category`/`q`, `radius`
  → normalized providers: name, address, location, phone, website, plus a **generated** free
  Google Maps deep link) and `GET /api/recommendations/:placeId`. Mount both in
  `api/src/index.ts` behind `authMiddleware`, following the existing
  `app.get("/api/…", authMiddleware, …)` pattern. No migration.
- **M3.3 — Web.** `/recommendations` (search + category filter chips + location) and
  `/recommendations/[id]` (detail, link out to Google). Skeletons while loading and rendered
  containers with explicit empty messages, per `CLAUDE.md`.
- **M3.4 — Mobile.** Recommendations tab in `UserTabsNavigator` + provider detail screen.
  May ship with M7 if mobile is sequenced later.

#### Provider data source options

Recorded 2026-08-31 so the spend conversation does not have to be re-researched.

| Source | Global? | Cost | Storable? | Ratings | Notes |
|---|---|---|---|---|---|
| **Google Places (New)** | ✅ | $32–40 / 1,000, tiny free tier | ❌ **No** (`place_id` only) | ✅ Best | The specced option. Uncacheable, so cost is permanent and grows with use. |
| **Geoapify** *(preferred)* | ✅ | Free 3k/day (limited commercial); **$59/mo** commercial | ✅ Yes | ❌ | OSM-derived, 800+ categories. Permissive licence is the point. |
| **HERE** | ✅ | 250k/mo free | ⚠️ 30 days, no repository | ❌ | Bigger free tier, weaker licence. Fallback. |
| **Overture Maps** | ✅ | **Free** bulk data | ✅ Yes | ❌ | **4,580,186** healthcare places worldwide (Aug 2026), CDLA Permissive 2.0 / Apache 2.0, monthly Parquet on S3. Zero marginal cost, but needs a DuckDB pipeline, PostGIS (not currently enabled) and a refresh job. The cheapest long-run answer if volume ever justifies the build. |
| **Foursquare OS Places** | ✅ | **Free** | ✅ Yes | ❌ | 100M+ POIs, Apache 2.0. Largely subsumed by Overture, which ingests it. |
| **OSM / Overpass live** | ✅ | Free | ✅ Yes | ❌ | Not production-safe on public instances (rate limits), and metadata is thin — a live probe of one market returned 339 healthcare POIs with phone on 14% and website on 2%. |
| National health-ministry registries | ❌ | Free | ✅ Yes | ❌ | Authoritative and complete for public facilities, but per-country sourcing does not scale. **Rejected on the scope note above.** |

---

### M4 — Patient self-pay *(depends on M1.3)*

**Mostly already done.** The retired docs listed the backend and web work as missing; it is not:

- `api/src/routes/wallet.ts` is role-agnostic — `targetPatientId = patientId ?? userId`
  (line 25), and the top-up intent only validates the target is non-staff (line 146). A
  patient can already fund their own wallet.
- `webapp/app/home/page.tsx:66-91` fetches `/api/wallet` for the signed-in user and renders
  `WalletCard`.

- **M4.1 — Mobile wallet top-up UI** on `UserHomeScreen`, reusing the existing `/api/wallet`
  endpoints. This is the entire remaining scope of self-pay.

---

### M5 — Notification coverage *(depends on M1.1)*

Cheap, and it is what makes the June features actually reach users. Today
`notification_type` holds only `consent_request, visit_update, no_show_alert,
sponsorship_accepted, coordination_note` — and no follow-up or status-update route calls
`createNotification` at all.

- **M5.1 — Migration `00037_notification_types.sql`** (next free number):
  `alter type public.notification_type add value if not exists` for `follow_up_due`,
  `follow_up_overdue`, `patient_status_update`.
- **M5.2 — Extend the `NotificationType` union** in `api/src/lib/notifications.ts:3-9`.
- **M5.3 — Fire the notifications.** From `api/src/routes/follow-ups.ts` on create and when
  due; from `api/src/routes/patient-status-updates.ts` to the patient and linked sponsors,
  respecting the row's `visibility`. Reuse `notifySponsorsOfPatient` — its type parameter
  needs widening past `"visit_update" | "no_show_alert"`.

---

### M6 — Patient page data gaps *(depends on M1.1)*

The `/patients` detail page shows real data wherever the backend has it (blood pressure,
weight, A1c, medication adherence, appointments, wallet, follow-ups, status updates) and a
**clearly labeled "not yet tracked" placeholder** everywhere it doesn't — never a fabricated
number. Each item below is one of those placeholders.

Per `CLAUDE.md`: skeletons while loading, and a rendered container with an explicit empty
message rather than a hidden card.

#### M6.1 — Heart rate & temperature

Moved to the front of this milestone: it is the only item that is a *metric* (two nullable
columns on the existing per-visit `patient_metrics` row) rather than a new entity. No new
table, no new RLS policy, no new route file — the smallest blast radius on the list.

**Where it shows today:** `webapp/app/patients/VitalsPanel.tsx:192-206` — two greyed,
dashed-border tiles next to the real BP/Weight/Adherence/A1c tiles.

1. **Migration `00038_patient_metrics_hr_temp.sql`** — note the renumber: the original plan
   said `00036`, which is taken by `appointment_booking_fields`, and `00037` is claimed by M5.1.

   ```sql
   alter table public.patient_metrics
     add column if not exists heart_rate_bpm integer,
     add column if not exists temperature_c numeric(4,1);
   ```

   `integer` for BPM matches `blood_pressure_systolic`/`diastolic`. `numeric(4,1)` for
   temperature mirrors `weight_kg numeric(5,2)`'s fixed-precision approach — Celsius, one
   decimal. Both nullable, so a visit can still record only some metrics. No RLS change:
   `patient_metrics` RLS in `00011_…` is row-scoped, not column-scoped.

2. **Write path** — `api/src/routes/appointments.ts`, `recordMetrics` (~line 246): extend the
   request body type with `heartRateBpm?: number` / `temperatureC?: number` and add
   `heart_rate_bpm: body.heartRateBpm ?? null` / `temperature_c: body.temperatureC ?? null`
   to the insert.

3. **Read paths** — four select lists currently share the identical column list
   `id, recorded_at, blood_pressure_systolic, blood_pressure_diastolic, weight_kg, a1c, medication_adherence`.
   Append `, heart_rate_bpm, temperature_c` to each:
   - `api/src/routes/clinician-portal.ts` — `getClinicianPortalAppointmentById` (~line 144)
   - `api/src/routes/home.ts` — `getSponsoredPatientDetail` (~line 246)
   - `api/src/routes/home.ts` — appointment detail handler (~line 418)
   - `api/src/routes/home.ts` — `getPatientMetrics` (~line 455)

   No new endpoint — these are existing authorized reads and the columns ride along.

4. **Capture form** — `webapp/app/home/appointments/[id]/AppointmentDetailClient.tsx`: state
   alongside the existing `weightKg`/`a1c` (~line 81-82), two inputs next to Weight/A1c
   (~line 312-320), and both fields in the `recordMetrics` payload (~line 128-132). Check
   `webapp/app/home/clinician-actions.ts` and `webapp/app/patients/actions.ts` for duplicated
   metrics type defs and extend those too, so TypeScript catches every call site.

5. **Display** — replace the two placeholder tiles in `VitalsPanel.tsx` with real tiles
   mirroring the Weight tile (latest value, sparkline over `previousMetrics`, delta vs. prior).
   A patient with zero readings still renders the tile, with "No heart rate recorded yet".

**Rollout:** migration → read paths → write path → UI. Each step is independently deployable
and backward compatible; no big-bang cutover.

#### M6.2 — Conditions & allergies

**Where:** `webapp/app/patients/PatientsPageClient.tsx:231` — a single dashed pill,
"Conditions & allergies — not yet tracked."

No structured field exists on `profiles` or anywhere else. This is safety-relevant data
(allergies in particular), so it should not live as freetext in a notes field.

- New `patient_conditions` table: `id, patient_id, label, type ('condition'|'allergy'),
  severity (nullable, for allergies), created_by, created_at`. A table rather than a single
  text column, so the UI can render tag pills ("Hypertension", "Type 2 diabetes",
  "Penicillin allergy").
- `GET /api/patients/:id/conditions`, clinician/admin-only write.
- Replace the placeholder pill with a real tag list; keep the placeholder at zero entries.
  Consider whether the UI needs to distinguish "not asked yet" from "asked, none".

#### M6.3 — Medications

**Where:** `PatientsPageClient.tsx` "Medications" card ("Medications aren't tracked yet") and
the "Medications" tab in `PatientTimelineTabs.tsx`.

`patient_metrics.medication_adherence` is a single qualitative enum (`good`/`fair`/`poor`)
per visit — a proxy for *how well* a patient takes their meds, not a record of *what* they take.
No medications table exists.

- New `medications` table: `id, patient_id, name, dosage, frequency, prescribed_by,
  started_at, ended_at (nullable — active if null), notes`.
- `GET /api/patients/:id/medications`, `POST`/`PATCH` for clinician/admin to prescribe/discontinue.
- Real card: active meds (name, dosage, frequency). The original mockup's per-med adherence
  pill would need adherence tracked *per medication* rather than per visit — a bigger lift,
  scoped as a fast-follow once the list exists.

#### M6.4 — Lab panel (LDL / HDL, generalized)

**Where:** `PatientsPageClient.tsx` "Labs" card — a real HbA1c bar (backed by
`patient_metrics.a1c`) alongside two greyed LDL/HDL rows.

No lab-panel table exists. `a1c` is a single column on `patient_metrics`, not a labs entity —
no independent draw date, no reference ranges, no arbitrary test types.

- New `lab_results` table: `id, patient_id, panel_type, test_name, value, unit,
  reference_low, reference_high, drawn_at, recorded_by, created_at`. Generalizes past LDL/HDL
  to any future lab type without further migrations.
- `GET /api/patients/:id/labs` — RLS-scoped read, mirroring `patient-status-updates.ts`'s
  pattern; `POST` for clinician/admin.
- Replace the hardcoded LDL/HDL rows with a mapped list; keep the "not tracked" treatment for
  any test type not yet recorded for that patient.

#### M6.5 — Care notes tab

**Where:** `PatientTimelineTabs.tsx:25` — `PLACEHOLDER_TABS` renders the generic
"isn't tracked yet" message.

Mostly wiring. `appointment_notes` already exists and is visit-scoped (`note_type`:
general/coordination/clinical_summary/discharge, from `00035`), but no endpoint returns a
patient's notes across all their appointments in one call.

- `GET /api/patients/:id/notes` — joins `appointment_notes` across the patient's appointments,
  respecting existing RLS (sponsors remain blocked from `coordination` notes by design).
- Render chronologically (date, note_type badge, content), reusing the note_type styling the
  clinician portal already has.

#### M6.6 — MRN & care team roster — **blocked on product input, not scheduled**

Dropped entirely from the current implementation (not even shown as a placeholder). The
original mockup's header showed an MRN and a "Care team: Dr. R. Osei, N. Baptiste" line.

No MRN field exists (patients are identified by `profiles.id` UUID). "Care team" isn't
modeled — `appointments.clinician_id` ties a clinician to a single visit only.

Decide first whether either is actually wanted. If yes: MRN could be a display-friendly code
derived from the profile id; care team would need a `patient_care_team` table
(`patient_id, clinician_id, role_label, added_at`) — *unless* "clinicians who've seen this
patient" suffices, which is derivable from distinct `appointments.clinician_id` with no new table.

#### M6.7 — Billing tab — **recommend dropping**

The wallet ledger (`wallet_transactions`) already covers top-ups and deductions and is shown
in the Wallet card. There is no separate billing concept, and under a wallet-based payment
model there probably shouldn't be. **Recommendation:** fold this into the Wallet card and
remove the placeholder tab. Revisit only if a real itemized-invoice need appears, at which
point it piggybacks on Stripe/wallet reconciliation rather than needing its own table.

---

### M7 — Mobile parity *(depends on M1.3)*

The largest remaining body of work, but it blocks nothing. All four June features were built
web-first and have no mobile counterpart — a grep for follow-up / status-update /
care-continuity / note_type across `mobile/components` returns only appointment-title strings
in mock data.

- **M7.1 — Follow-up tracking** — "Add follow-up" on `ClinicianAppointmentDetailScreen`;
  pending items on the patient home screen; overdue surfaced on `ClinicianDashboardScreen`.
- **M7.2 — Patient status updates** — "Post status update" on `ClinicianPatientDetailScreen`;
  status feed on `UserHomeScreen` / `PatientDetailScreen`.
- **M7.3 — Care continuity** — rework `ClinicianDashboardScreen` to lead with care gaps
  ("not seen in 30+ days", overdue follow-ups); Care Summary card per linked patient on user home.
- **M7.4 — Structured clinic notes** — note type selector (general / coordination /
  clinical_summary / discharge) and "flag for follow-up" toggle in the note creation UI.
- Plus **M4.1** (wallet top-up) if not already taken. **M3.4** (recommendations tab) only if
  M3 has been unblocked by then.

---

## Correcting the record

Claims in the retired docs that this audit disproved:

| Retired claim | Reality |
|---|---|
| "Priority 4 — Patient Self-Pay" backend + web unbuilt | Both done. `wallet.ts` is role-agnostic; `/home` renders `WalletCard` for the signed-in patient. Only mobile remains (M4.1). |
| "6.4 — Patient self-view on `/home` deferred" | Done. `webapp/app/home/page.tsx:75` fetches status updates, metrics and follow-ups for the signed-in patient. |
| `PROGRESS.md` "Completed: Nothing completed yet" | Five roadmap priorities shipped on web. |
| HR/temp migration numbered `00036` | `00036` is taken by `appointment_booking_fields`. Renumbered to `00038` (M6.1); `00037` goes to M5.1. |
| Care plan tiers fully removed | Removed on web and in the DB. `home.ts:54`'s dropped-column select is now fixed (M1.2 ✅); mobile still renders the picker and calls a deleted route (M1.3). |
| Referral management is roadmap priority 5 / upcoming #3 | **Out of scope.** Roadmap count is 5 / 7. |
| Recommendations "re-scoped, next: 2.2 backend" | Still zero implementation two months later — and now **blocked on a spend decision** (M3), not on engineering. |

---

## Housekeeping note

`CLAUDE.md` has three stale doc references, none of which resolve:

- "Active work is tracked in `webapp/PROGRESS.md`" → was `docs/PROGRESS.md`, now this file.
- Repository layout names `docs/API-MIGRATION.md` and `docs/STRIPE.md` — neither exists.
- The "Product direction" priority list (1–8) still includes referral management at #5 and
  should be replaced with the M1–M7 ladder above.

Worth fixing the next time `CLAUDE.md` is touched.
