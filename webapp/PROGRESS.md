# Island Echoes Health — Work Progress Tracker

---

## Current Session

| Field | Value |
|---|---|
| **Last session date** | — |
| **Current focus area** | — |
| **Status** | Not started |

> Update this table at the start of each session.

---

## Session Log

| # | Date | Focus | Notes |
|---|---|---|---|
| — | — | — | — |

> Add a row each session. Example: `| 1 | 2026-06-22 | Priority 1 — Remove care plan tiers | Completed DB migration, updated LinkPatientScreen |`

---

## Action Items

Items are ordered by the recommended priority from the gap analysis. Check off each item as it is completed. Sub-items represent discrete implementation steps (DB → API → UI).

---

### Priority 1 — Remove Care Plan Tiers & Simplify Payment
> Collapse 3-tier care plan model into a single sponsorship option. Retain ability for sponsors AND patients to pay.

- [ ] **1.1 — Database**
  - [ ] Write migration to deprecate/remove tier-specific columns (`visits_per_month`, `chronic_labs_per_quarter`, `features` array, `stripe_price_id`) from `care_plans`
  - [ ] Decide on single flat sponsorship amount and update seed data

- [ ] **1.2 — Backend**
  - [ ] Simplify `POST /api/sponsorship/create-payment` to not require `care_plan_id`
  - [ ] Remove `getOrCreatePriceForCarePlan()` tier logic; replace with single Stripe price
  - [ ] Update `GET /api/care-plans` or remove route if no longer needed

- [ ] **1.3 — Web**
  - [ ] Remove `PurchasePlanForm` plan-tier selector
  - [ ] Remove or repurpose `/pricing` page
  - [ ] Update sponsorship UI copy (from "buy a care plan" → "support a family member")

- [ ] **1.4 — Mobile**
  - [ ] Remove care plan dropdown from `LinkPatientScreen`
  - [ ] Update home screen CTA copy (from "Sponsor a care plan" → family support framing)

---

### Priority 2 — Healthcare Recommendations Directory
> Build the provider directory from scratch. This is the highest-priority new feature.

- [ ] **2.1 — Database**
  - [ ] Create `providers` table (id, name, category enum, country, city, description, website, phone, verified, created_at)
  - [ ] Create `provider_category` enum (clinic, mental_health, specialist, pharmacy, diagnostic, wellness)
  - [ ] Create `provider_feedback` table (id, provider_id, user_id, rating 1–5, comment, created_at)
  - [ ] Add RLS policies (public read, authenticated users submit feedback, admin manages providers)

- [ ] **2.2 — Backend**
  - [ ] `GET /api/recommendations` — list/search with filters (category, country, search term)
  - [ ] `GET /api/recommendations/:id` — provider detail + aggregated rating + feedback list
  - [ ] `POST /api/recommendations/:id/feedback` — authenticated user submits rating/comment
  - [ ] `POST /api/admin/providers` — admin creates provider listing
  - [ ] `PATCH /api/admin/providers/:id` — admin edits/verifies provider

- [ ] **2.3 — Mobile**
  - [ ] Add Recommendations tab to `UserTabsNavigator`
  - [ ] Build `RecommendationsScreen` — list with search bar and category filter chips
  - [ ] Build `ProviderDetailScreen` — info, rating, feedback list, "Request referral" CTA
  - [ ] Add country/location filter UI

- [ ] **2.4 — Web**
  - [ ] Create `/recommendations` page — provider directory with search + filters
  - [ ] Create `/recommendations/[id]` page — provider detail view
  - [ ] Add admin UI for managing provider listings

---

### Priority 3 — Follow-up Tracking
> Standalone follow-up tasks, not just a tag on appointments.

- [ ] **3.1 — Database**
  - [ ] Create `follow_up_status` enum (pending, completed, overdue)
  - [ ] Create `follow_ups` table (id, patient_id, clinician_id, appointment_id nullable, due_date, status, notes, created_at, completed_at)
  - [ ] Add RLS policies

- [ ] **3.2 — Backend**
  - [ ] `POST /api/follow-ups` — clinician creates follow-up
  - [ ] `GET /api/follow-ups` — list (patient sees own; clinician sees assigned; sponsor sees linked patient's)
  - [ ] `PATCH /api/follow-ups/:id` — update status or notes

- [ ] **3.3 — Mobile**
  - [ ] Add "Add follow-up" action on `ClinicianAppointmentDetailScreen`
  - [ ] Add follow-up section to patient home screen (pending items)
  - [ ] Surface overdue follow-ups on clinician dashboard

- [ ] **3.4 — Web**
  - [ ] Add follow-up creation flow to appointment detail page
  - [ ] Add follow-ups panel to clinician portal dashboard

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

- [ ] **6.1 — Database**
  - [ ] Create `visibility` enum (all, sponsor_only, patient_only)
  - [ ] Create `patient_status_updates` table (id, patient_id, created_by, status_text, visibility, created_at)
  - [ ] Add RLS policies (clinician inserts; patient + linked sponsors read based on visibility)

- [ ] **6.2 — Backend**
  - [ ] `POST /api/patients/:id/status-updates` — clinician posts update
  - [ ] `GET /api/patients/:id/status-updates` — patient/sponsor reads updates

- [ ] **6.3 — Mobile**
  - [ ] Add "Post status update" action on `ClinicianPatientDetailScreen`
  - [ ] Add status feed to user home / sponsored patient detail screen

- [ ] **6.4 — Web**
  - [ ] Status update post UI in clinician portal
  - [ ] Status feed in sponsored patient detail view

- [ ] **6.5 — Notifications**
  - [ ] Add `patient_status_update` to `notification_type` enum
  - [ ] Trigger notification to patient and linked sponsors on new update

---

### Priority 7 — Care Continuity Dashboard
> Depends on Priority 3 (follow-ups) and Priority 6 (status updates) being in place.

- [ ] **7.1 — Backend**
  - [ ] Extend clinician portal API to return: days since last appointment per patient, overdue follow-up count, pending referral count
  - [ ] Extend home API to return care summary per linked patient (last visit, next appointment, alerts)

- [ ] **7.2 — Mobile (Clinician)**
  - [ ] Rework `ClinicianDashboardScreen` to lead with care gaps
  - [ ] Add "patients not seen in 30+ days" list
  - [ ] Surface overdue follow-ups and pending referrals

- [ ] **7.3 — Mobile (Sponsor/Family)**
  - [ ] Add "Care Summary" card per linked patient on user home
  - [ ] Show: last visit date, next appointment, open follow-ups, any alerts

- [ ] **7.4 — Web**
  - [ ] Rework clinician portal dashboard to care-continuity framing
  - [ ] Add care summary panel to sponsored patient detail view

---

### Priority 8 — Structured Clinic Notes & Coordination Workflows
> Enhance existing appointment notes with structure and coordination triggers.

- [ ] **8.1 — Database**
  - [ ] Extend `appointment_notes.note_type` enum: add `coordination`, `clinical_summary`, `discharge`
  - [ ] No new table needed; extend existing `appointment_notes`

- [ ] **8.2 — Backend**
  - [ ] Update `POST /api/appointments/:id/notes` to accept new note types
  - [ ] Trigger notification to care coordinator on `coordination` note type

- [ ] **8.3 — Mobile**
  - [ ] Add note type selector (General / Clinical Summary / Coordination / Discharge) to note creation UI
  - [ ] Add "Flag for follow-up" toggle on coordination notes (auto-creates a follow-up task)

- [ ] **8.4 — Web**
  - [ ] Update appointment detail note form to include note type selector

---

## Completed

> Move items here (copy the checkbox line) once fully shipped and tested.

- Nothing completed yet.

---

## Deferred / Decisions Pending

> Items that are blocked on a product decision before work can begin.

| Item | Blocker |
|---|---|
| 1.1 — Single sponsorship amount | What is the flat amount? Or is it flexible/custom? |
| 2.1 — Provider seeding | Who seeds initial provider listings? Admin manually or import? |

