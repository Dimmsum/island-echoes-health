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

Two remain: **provider recommendations** (not started, but the spend decision that was
blocking it is now resolved — see M3) and **patient self-pay** (backend + web are actually
done — only mobile is left). Referral management, previously counted as an eighth, is
**out of scope** — see below.

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
| Provider recommendations | ⏳ not started (unblocked) | ⏳ not started (unblocked) |

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
| **M3** | Provider recommendations | — (unblocked 2026-09-03) | L |
| **M4** | Patient self-pay — finish | M1.3 | S |
| **M5** | Notification coverage ✅ | M1.1 | S |
| **M6** | Patient page data gaps (M6.1 ✅, M6.2 ✅) | M1.1 | M–L |
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

- **M1.5 — Provider API key.** Provision `GOOGLE_PLACES_API_KEY` (Places API (New),
  Enterprise-tier fields enabled so `rating`/`userRatingCount` can be requested). Self-serve
  via Google Cloud Console, no procurement lead time. Needed before M3.1 can be implemented.

---

### M2 — Drop referral management

Execute the scrub table in [Explicitly out of scope](#explicitly-out-of-scope-referral-management).
Roughly 20 lines of mobile onboarding copy plus one mock string. Record the decision so the
care-continuity endpoint's missing referral count reads as intentional to the next reader.

---

### M3 — Provider recommendations — ✅ **UNBLOCKED (2026-09-03): spend approved**

The one remaining major user-facing feature. Zero implementation exists today — the only
repo-wide hit for "recommendation" is a string in mobile mock data.

**Unblocked 2026-09-03.** The product requirement is to recommend nearby healthcare providers
factoring in **both** location and quality (rating) — a rating-less discovery list doesn't
meet that bar, so the free-tier-only path considered on 2026-08-31 was rejected. Decision:
**accept Google's recurring per-search cost as an approved budget line** and build against
**Google Places (New), Enterprise tier**, which is the only source in the table below with
Google-quality ratings. Research backing this is recorded in
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
  the product requirement above explicitly does — promotes the call to **Enterprise, $35 per
  1,000**; adding reviews or other atmosphere fields makes it **$40 per 1,000**.
- Free allowance is **per SKU and small**: 10,000 calls/month for Essentials, 5,000 for Pro,
  **1,000 for Enterprise**. The old flat $200/month credit was withdrawn and no longer exists.
  **Note (2026-09-03):** the 10,000/mo figure is real but applies only to Essentials, which
  has no `rating` field — it does not apply once ratings are requested, which is why this was
  briefly (and incorrectly) assumed to already be within free budget.
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

**The decision that was needed (resolved 2026-09-03).** The feature could have split into a
free discovery piece (location, categories, address, phone, website — fundable on a
free-tier/cacheable source) and a paid piece (the numeric rating, Google Enterprise only,
$35 per 1,000 searches, uncacheable). Since the product requirement is location **and**
quality together, splitting vendors would mean paying for Google Enterprise *anyway* to get
ratings, while also running a second free source for discovery — extra integration cost for
no savings. **Decision: use Google Places Enterprise for both**, and accept the per-search
cost as a recurring budget line. This is understood as a permanent cost that scales with
adoption (see the cost table above), not a one-off — worth revisiting only if volume grows
enough to justify a hybrid (free/cacheable source for discovery, Google called only for
rating on detail-view) — see [Provider data source options](#provider-data-source-options).

**Approach** (revised 2026-09-03, supersedes the 2026-08-31 Geoapify-primary direction):
**Google Places (New)** is the sole vendor, at Enterprise tier so `rating`/`userRatingCount`
can be requested alongside search fields. Country-agnostic (coordinates + radius, no hardcoded
country), consistent with the scope note above. No caching of name/address/phone/rating per
Google's terms — only `place_id` may be retained.

- **M3.1 — `api/src/lib/googlePlaces.ts`.** Native `fetch` against Places API (New)
  Text Search / Nearby Search + Place Details, mirroring the module shape of
  `api/src/lib/stripe.ts` (`isGooglePlacesConfigured()` / throw-on-missing-key, per
  `getStripe`/`isStripeConfigured`). Request an Enterprise-tier field mask
  (`places.rating,places.userRatingCount,places.displayName,places.formattedAddress,places.location,places.internationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.types`)
  and map Google's `type` taxonomy to our healthcare categories (`hospital`, `pharmacy`,
  `doctor`, `dentist`, etc). Return 503 when `GOOGLE_PLACES_API_KEY` is unset. **No response
  caching** — every call re-fetches live, per licence.
- **M3.2 — Routes.** `GET /api/recommendations/search` (`lat`, `lng`, `category`/`q`, `radius`
  → normalized providers: name, address, location, phone, website, Google rating/review count,
  plus the `googleMapsUri` link-out) and `GET /api/recommendations/:placeId`. Mount both in
  `api/src/index.ts` behind `authMiddleware`, following the existing
  `app.get("/api/…", authMiddleware, …)` pattern. No migration — `place_id` is the only field
  ever persisted, and only if we later add saved/favorite providers.
- **M3.3 — Web.** `/recommendations` (search + category filter chips + location) and
  `/recommendations/[id]` (detail, in-app rating badge, link out to Google). Skeletons while
  loading and rendered containers with explicit empty messages, per `CLAUDE.md`.
- **M3.4 — Mobile.** Recommendations tab in `UserTabsNavigator` + provider detail screen.
  May ship with M7 if mobile is sequenced later.

#### Provider data source options

Recorded 2026-08-31, decision made 2026-09-03, so the spend conversation does not have to be
re-researched.

| Source | Global? | Cost | Storable? | Ratings | Notes |
|---|---|---|---|---|---|
| **Google Places (New)** *(chosen)* | ✅ | $32–40 / 1,000, tiny free tier | ❌ **No** (`place_id` only) | ✅ Best | **Selected 2026-09-03** — the only option with ratings, which the product requires. Uncacheable, so cost is permanent and grows with use; accepted as a recurring budget line. |
| **Geoapify** | ✅ | Free 3k/day (limited commercial); **$59/mo** commercial | ✅ Yes | ❌ | OSM-derived, 800+ categories. Rejected as primary — no ratings, and ratings are a hard requirement. Worth revisiting as a location-only supplement if volume ever makes an all-Google approach too costly. |
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

✅ **Done (2026-08-31).** `notification_type` now also holds `follow_up_due`,
`follow_up_overdue`, `patient_status_update`, and both `follow-ups.ts` and
`patient-status-updates.ts` call `createNotification`.

- ~~**M5.1 — Migration `00037_notification_types.sql`**~~ ✅ Done —
  `alter type public.notification_type add value if not exists` for `follow_up_due`,
  `follow_up_overdue`, `patient_status_update`.
- ~~**M5.2 — Extend the `NotificationType` union**~~ ✅ Done — now exported from
  `api/src/lib/notifications.ts:3-11`, and `notifySponsorsOfPatient` was widened from
  `"visit_update" | "no_show_alert"` to the full union, plus an optional `referenceId`.
- ~~**M5.3 — Fire the notifications.**~~ ✅ Done, with two decisions made along the way:
  - **Follow-up creation notifies the patient only** (`follow_up_due`), not sponsors — a
    follow-up is a clinical task scoped to the patient. Both creation paths fire it:
    `createFollowUp` in `follow-ups.ts` and the `flag_for_follow_up` auto-create in
    `appointments.ts`.
  - **Status updates fan out by `visibility`**: `all`/`patient_only` notify the patient,
    `all`/`sponsor_only` notify active sponsors via `notifySponsorsOfPatient`.
  - **Overdue needed a trigger the API didn't have.** `00033` deliberately makes "overdue"
    derived, and there is no scheduler anywhere in `api/` (no cron, pg_cron, `setInterval`).
    Added `POST /api/jobs/follow-up-reminders` (not behind `authMiddleware`; guarded by an
    `x-cron-secret` header matched against `CRON_SECRET`, 503 if unset) that scans pending
    follow-ups daily and notifies the patient (`follow_up_due`, due today) or the owning
    clinician (`follow_up_overdue`, past due). Idempotent per day via the new
    `createNotificationOnce` helper. **Outstanding deploy step:** nothing calls this endpoint
    yet — wire Supabase `pg_cron` (or any external scheduler) to hit it daily with the secret
    header.

---

### M6 — Patient page data gaps *(depends on M1.1)*

The `/patients` detail page shows real data wherever the backend has it (blood pressure,
weight, A1c, medication adherence, appointments, wallet, follow-ups, status updates) and a
**clearly labeled "not yet tracked" placeholder** everywhere it doesn't — never a fabricated
number. Each item below is one of those placeholders.

Per `CLAUDE.md`: skeletons while loading, and a rendered container with an explicit empty
message rather than a hidden card.

**Status: M6.1 ✅, M6.2 ✅ (both shipped 2026-08-31) — M6.3–M6.5 remain; M6.6/M6.7 not scheduled.**

#### M6.1 — Heart rate & temperature ✅ Done (2026-08-31)

Shipped as the front of this milestone: the only item that was a *metric* (two nullable
columns on the existing per-visit `patient_metrics` row) rather than a new entity — no new
table, no new RLS policy, no new route file, the smallest blast radius on the list.

Real tiles now render in `webapp/app/patients/VitalsPanel.tsx` (latest value, sparkline,
delta vs. prior), replacing the two greyed dashed-border placeholders. A patient with zero
readings renders the tile with "No heart rate recorded yet" / "No temperature recorded yet".

1. **Migration `00038_patient_metrics_hr_temp.sql`** — `alter table patient_metrics add
   column if not exists heart_rate_bpm integer, add column if not exists temperature_c
   numeric(4,1)`, both nullable. No RLS change (`patient_metrics` RLS is row-scoped).
2. **Two write paths, both updated** — the original plan named only
   `api/src/routes/appointments.ts`'s `recordMetrics` (mobile's write path, actual line 261
   not the estimated 246). Implementation found the web clinician UI doesn't call that API
   route at all: `webapp/app/home/appointments/[id]/AppointmentDetailClient.tsx` calls the
   Next.js server action `recordPatientMetrics` in `webapp/app/home/clinician-actions.ts`,
   which does its own direct Supabase insert. Both were extended with `heartRateBpm`/
   `temperatureC`.
3. **Read paths** — the two new columns were appended to five selects sharing the same
   column list (one more than originally scoped, found during implementation):
   `api/src/routes/clinician-portal.ts` (`getClinicianPortalAppointmentById`),
   `api/src/routes/home.ts` (`getSponsoredPatient`, the appointment-detail handler,
   `getPatientMetrics`), and `webapp/app/clinician-portal/appointments/[id]/page.tsx` — a
   direct-Supabase legacy read feeding the clinician-portal's own appointment detail page
   that the original plan missed.
4. **Capture form** — `AppointmentDetailClient.tsx` (web) gained heart-rate/temperature
   inputs in the metrics form; `PatientMetric` type in `webapp/app/home/actions.ts` and the
   `PreviousMetric` type in the clinician-portal's `AppointmentDetailClient.tsx` both extended
   so TypeScript catches every call site.

#### M6.2 — Conditions & allergies ✅ Done (2026-08-31)

**Was:** `webapp/app/patients/PatientsPageClient.tsx:231` — a single dashed pill,
"Conditions & allergies — not yet tracked." **Now:** a real tag list, styled to distinguish
allergies (warning tone) from conditions (neutral tone), with "No conditions or allergies
recorded" for a patient with zero entries. The "not asked yet" vs. "asked, none" distinction
this item raised was deliberately left out — the schema has no such flag, and the doc only
asked to "consider" it.

Unlike M6.1, this was a genuinely new resource, so it followed the newest RLS/table
precedent in the codebase (`follow_ups`/`patient_status_updates`, 00033/00034) rather than
the older `patient_metrics` (00011) pattern: **no authenticated write policy** — all writes
go through the API's service-role client, with `clinician`/`admin` enforced entirely by
Express middleware, not in SQL.

- **Migration `00039_patient_conditions.sql`** (renumbered from the original `00038` guess,
  since M6.1's metrics migration claimed that slot) — new `patient_conditions` table
  (`id, patient_id, label, type` enum `'condition'|'allergy', severity` nullable text,
  `created_by, created_at`), RLS: patient reads own, sponsor reads linked, clinician **and
  admin** read all (the doc's precedent, `follow_ups`, only granted `clinician`; admin was
  added explicitly since the doc calls for clinician/admin write), service-role-only writes.
- **API** — new `api/src/routes/patient-conditions.ts` (`listConditions` via RLS-scoped
  read, `createCondition` via service-role client with a patient-role guard, mirroring
  `patient-status-updates.ts`), mounted as `GET`/`POST /api/patients/:id/conditions` in
  `api/src/index.ts` (`POST` gated by `requireClinicianOrAdmin`).
- **Web write UI** — the doc didn't specify where clinicians would add this data; there is
  no standalone clinician-facing patient-detail page outside of appointments, so a new
  `ConditionsSection.tsx` was added to `webapp/app/clinician-portal/appointments/[id]/`
  alongside the existing `FollowUpsSection`/`StatusUpdatesSection` (list + add form), backed
  by new `condition-types.ts` and `condition-actions.ts` files mirroring the status-update
  three-file pattern.
- **Web read wiring** — `fetchPatientConditions` added to `webapp/app/home/actions.ts`;
  `webapp/app/patients/actions.ts`'s `SponsoredPatientDetail` type now carries `conditions`
  for both the sponsor and self-view paths.

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
| Recommendations "re-scoped, next: 2.2 backend" | Still zero implementation two months later. Was briefly blocked on a spend decision (M3); **unblocked 2026-09-03** — Google Places Enterprise-tier cost approved so ratings can be included. |

---

## Housekeeping note

`CLAUDE.md` has three stale doc references, none of which resolve:

- "Active work is tracked in `webapp/PROGRESS.md`" → was `docs/PROGRESS.md`, now this file.
- Repository layout names `docs/API-MIGRATION.md` and `docs/STRIPE.md` — neither exists.
- The "Product direction" priority list (1–8) still includes referral management at #5 and
  should be replaced with the M1–M7 ladder above.

Worth fixing the next time `CLAUDE.md` is touched.
