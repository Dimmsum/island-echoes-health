# Island Echoes Health — Gap Analysis & Product Direction Findings

> **Date:** 2026-06-22
> **Reference:** Island Echoes Health Updates 5-27-26.docx
> **Scope:** Full codebase audit (backend API, mobile app, web app) against stated product direction

---

## Executive Summary

The platform has a solid technical foundation (auth, appointments, clinician portal, Stripe payments, mobile + web clients) but is **significantly misaligned** with the new product direction in three areas:

1. The **Healthcare Recommendations Layer** — described as a "major visible feature" — does not exist at all.
2. The **care continuity** framing is absent; current dashboards are appointment-centric, not care-journey-centric.
3. The **payment/sponsorship model** has tiered care plans that the new direction explicitly wants removed.

---

## 1. What Exists Today (Inventory)

### Backend (API — Node.js/Express + Supabase)
| Area | Status |
|---|---|
| Auth (email/password, OTP, role-based) | ✅ Built |
| Appointment CRUD + status tracking | ✅ Built |
| Appointment notes & service types | ✅ Built |
| Patient vitals/metrics recording | ✅ Built |
| Clinician approval workflow (admin) | ✅ Built |
| Sponsorship consent flow | ✅ Built |
| Stripe subscription payments | ✅ Built |
| Notification system (in-app) | ✅ Built |
| Follow-up tracking (standalone) | ❌ Missing |
| Referral management | ❌ Missing |
| Patient status / health status field | ❌ Missing |
| Healthcare provider recommendations | ❌ Missing |
| Country/location filtering | ❌ Missing |
| Patient self-pay (non-sponsor) | ❌ Missing |
| Community/patient feedback on providers | ❌ Missing |

### Frontend — Mobile (React Native/Expo)
| Screen/Feature | Status |
|---|---|
| Onboarding & role selection | ✅ Built |
| User home dashboard | ✅ Built |
| Appointments list + detail | ✅ Built |
| Linked patients (sponsor view) | ✅ Built |
| Clinician dashboard + schedule | ✅ Built |
| Clinician patient detail + vitals | ✅ Built |
| Link patient (Stripe checkout) | ✅ Built |
| Profile + avatar management | ✅ Built |
| Care continuity dashboard | ❌ Missing |
| Follow-up tracking screen | ❌ Missing |
| Referrals screen | ❌ Missing |
| Recommendations browse/search | ❌ Missing |
| Patient status updates feed | ❌ Missing |
| Family/diaspora informed view | ❌ Missing |

### Frontend — Web (Next.js)
| Page/Feature | Status |
|---|---|
| Landing page | ✅ Built |
| User home + appointments | ✅ Built |
| Clinician portal dashboard | ✅ Built |
| Admin clinician approval | ✅ Built |
| Pricing page | ✅ Built (but misaligned — see §2) |
| Sponsorship purchase form | ✅ Built |
| Care continuity dashboard | ❌ Missing |
| Recommendations directory | ❌ Missing |
| Follow-up / referral management | ❌ Missing |

---

## 2. Misalignments — What Conflicts With the New Direction

### 2.1 Tiered Care Plan Payment Model (MUST CHANGE)
**Current:** Three subscription tiers — *Core Wellness*, *Chronic Care*, *Premium Coordination* — each with different prices and feature sets. Sponsors select a tier when linking a patient.

**Direction says:** *"Remove the levels of payment options — keep that family sponsors and patients can pay."*

**Impact:**
- `care_plans` table with 3 SKUs, `stripe_price_id` per plan, `visits_per_month`, `chronic_labs_per_quarter`, etc.
- `PurchasePlanForm` on web, care plan selector in `LinkPatientScreen` on mobile.
- Pricing page (`/pricing`) exposes these tiers publicly.
- All sponsorship flows pass a `care_plan_id`.

**Required change:** Collapse to a single sponsorship option (or simple flat amount). Remove the plan-picker UI. Simplify the Stripe setup to a single price. Keep the ability for both sponsors AND patients to initiate payment.

---

### 2.2 Sponsorship Framing vs. Family Support Layer
**Current:** System is modeled as "sponsor a care plan for a patient." The UI language and data model center on *care plans* as the unit being purchased.

**Direction says:** The secondary focus is *"allowing families, including diaspora family members, to remain informed and financially supportive."*

**Impact:** The framing needs to shift from "purchasing a plan" to "supporting a family member's care." This affects UI copy, onboarding, and the home dashboard CTAs. The underlying consent + Stripe flow can remain but should be reframed.

---

### 2.3 Appointments Dashboard ≠ Care Continuity Dashboard
**Current:** The clinician dashboard shows *counts* (total patients, upcoming appointments, today's appointments). The user home shows upcoming appointments.

**Direction says:** *"Care continuity dashboard"* — visibility into what happens **after** appointments, gaps in care, follow-up status.

**Impact:** The dashboards need a new data layer: follow-up status per patient, days since last visit, overdue follow-ups, referral status. Neither the DB schema nor the API expose this today.

---

### 2.4 "Follow-up" Is a Service Type, Not a Tracked Entity
**Current:** `follow_up` is one value in the `appointment_service_type` enum — it can be logged on an appointment, but there's no way to create, track, or close a follow-up task independently.

**Direction says:** *"Follow-up tracking"* is a core platform feature.

**Impact:** Need a `follow_ups` table and associated API/UI to create follow-up tasks (from an appointment or standalone), assign due dates, mark completed, and surface overdue ones.

---

### 2.5 No Referral System
**Current:** No `referrals` table, no referral API, no referral UI on either platform.

**Direction says:** *"Referral management"* and *"referral support"* under the recommendations layer.

**Impact:** Full referral system needed: clinician creates referral → links to a provider (from recommendations directory) → patient is notified → referral status tracked (pending/accepted/completed).

---

### 2.6 No Patient Status Updates
**Current:** Patient health data exists only as point-in-time vitals on appointments. There is no concept of an ongoing patient health status or status feed visible to sponsors/family.

**Direction says:** *"Patient status updates"* is a listed core feature.

**Impact:** Need a mechanism for clinicians to post status updates on a patient (or for the system to generate them from appointment outcomes) that family sponsors can see — without exposing full clinical notes.

---

## 3. Missing Features — What Needs to Be Built

### 3.1 Healthcare Recommendations Layer (Highest Priority New Feature)

The document calls this *"a major visible feature."* Currently **zero** implementation exists.

**Required components:**

**Database (new tables):**
- `providers` — id, name, category (clinic/mental_health/specialist/pharmacy/diagnostic/wellness), country, city/parish, description, website, phone, verified (bool), created_at
- `provider_feedback` — id, provider_id, user_id (FK profiles), rating (1–5), comment, created_at
- `provider_recommendations` — optional curated list table (admin-managed)

**Backend (new routes):**
- `GET /api/recommendations` — List/search providers (filter by category, country, search term)
- `GET /api/recommendations/:id` — Provider detail + feedback
- `POST /api/recommendations/:id/feedback` — Submit patient feedback/rating
- `POST /api/admin/providers` — Admin: add/edit/verify provider
- `PATCH /api/admin/providers/:id` — Admin: update provider listing

**Mobile (new screens):**
- Recommendations tab (new tab in user navigation) — browse/search directory
- Provider detail screen — info, ratings, "refer this provider" action
- Category filter UI (chips: Clinic, Mental Health, Specialist, Pharmacy, etc.)
- Country/location filter

**Web (new pages):**
- `/recommendations` — Public-facing or authenticated directory
- `/recommendations/[id]` — Provider detail

---

### 3.2 Follow-up Tracking System

**Database:**
- `follow_ups` — id, patient_id, clinician_id, appointment_id (nullable, source appointment), due_date, status (pending/completed/overdue), notes, created_at, completed_at

**Backend:**
- `POST /api/follow-ups` — Create follow-up (clinician)
- `GET /api/follow-ups` — List follow-ups (patient sees own, clinician sees their patients)
- `PATCH /api/follow-ups/:id` — Update status / add notes

**UI:**
- Clinician: "Add follow-up" action on appointment detail → set due date + instructions
- User home: "Your follow-ups" section showing pending items
- Clinician dashboard: Overdue follow-ups surfaced prominently (care continuity)

---

### 3.3 Referral Management

**Database:**
- `referrals` — id, patient_id, referring_clinician_id, provider_id (FK providers, nullable), provider_name_free_text (fallback), reason, status (created/sent/accepted/completed), created_at, updated_at

**Backend:**
- `POST /api/referrals` — Clinician creates referral
- `GET /api/referrals` — Patient/clinician/sponsor views referrals
- `PATCH /api/referrals/:id/status` — Update status

**UI:**
- Clinician: "Create referral" on patient detail screen
- Patient: "My referrals" section on home
- Sponsor: Can see patient's referral status

---

### 3.4 Patient Status Updates

**Database:**
- `patient_status_updates` — id, patient_id, created_by (clinician_id), status_text, visibility (all/sponsor_only/patient_only), created_at

**Backend:**
- `POST /api/patients/:id/status-updates` — Clinician posts update
- `GET /api/patients/:id/status-updates` — Patient/sponsor views updates

**UI:**
- Clinician: "Post status update" on patient detail
- Sponsor home / sponsored patient view: Status feed
- Notification triggered on new update

---

### 3.5 Care Continuity Dashboard

Requires the follow-up and status update systems above to exist first.

**Data needed (new API shapes):**
- Days since last appointment per patient
- Overdue follow-ups count
- Pending referrals count
- Recent status updates

**UI:**
- Clinician: Rework dashboard to lead with care gaps (overdue follow-ups, patients not seen in 30+ days)
- Sponsor/family view: Simple "Care Summary" per linked patient (last visit, next appointment, any alerts)

---

### 3.6 Patient Self-Pay

**Current:** Only sponsors can initiate payment. Patients have no self-pay path.

**Direction says:** *"Keep that family sponsors and patients can pay."*

**Required:**
- New signup flow / profile setting: patient pays for themselves
- Payment initiation from patient's own home screen
- Stripe checkout session created for patient role (not just sponsor)

---

### 3.7 Clinic Notes & Coordination Workflows

**Current:** Notes exist per appointment but are unstructured (free text, note_type='general').

**Direction says:** *"Clinic notes and coordination workflows."*

**Required:**
- Structured note types: clinical summary, coordination note, discharge note
- Coordination workflow: clinician flags patient for follow-up or referral from within the note
- Notification to assigned clinician when coordination note is posted

---

## 4. Notification System — Gaps

Current notification types: `consent_request`, `visit_update`, `no_show_alert`, `sponsorship_accepted`

**Missing notification types needed:**
- `follow_up_due` — Clinician/patient alerted when follow-up is approaching
- `follow_up_overdue` — Escalation
- `referral_update` — Referral status change
- `patient_status_update` — Sponsor sees new clinician update
- `new_recommendation` — (Optional) new provider added in patient's area

---

## 5. Priority Order (Recommended)

| Priority | Feature | Effort | Rationale |
|---|---|---|---|
| 1 | Remove care plan tiers / simplify payment | Low | Explicitly called out; unblocks cleaner sponsorship flow |
| 2 | Healthcare Recommendations directory | High | "Major visible feature" — most impactful missing piece |
| 3 | Follow-up tracking | Medium | Core to care continuity; needed by dashboard |
| 4 | Patient self-pay | Low–Medium | Unblocks patients who don't have a sponsor |
| 5 | Referral management | Medium | Depends on recommendations (provider list) |
| 6 | Patient status updates | Medium | Key for family/diaspora informed view |
| 7 | Care continuity dashboard | Medium | Depends on follow-ups + status updates |
| 8 | Structured clinic notes / coordination workflows | Medium | Enhances existing notes; needed for coordinator role |

---

## 6. Schema Changes Summary

| Table | Action |
|---|---|
| `care_plans` | Simplify or deprecate tiered structure; move to single sponsorship amount |
| `providers` | **New** — healthcare provider directory |
| `provider_feedback` | **New** — community ratings on providers |
| `follow_ups` | **New** — follow-up task tracking |
| `referrals` | **New** — referral management |
| `patient_status_updates` | **New** — clinician-posted patient status |
| `notification_type` enum | Extend with new types listed above |
| `appointment_notes.note_type` | Extend enum: add `coordination`, `clinical_summary`, `discharge` |

---

## 7. What Can Stay As-Is

- Auth system (email/password, OTP, roles)
- Clinician onboarding/approval workflow
- Appointment CRUD and vitals recording
- Stripe integration foundation (webhook handling, customer management)
- Notification delivery infrastructure
- Avatar/profile management
- Mobile navigation architecture (just add tabs/screens)

