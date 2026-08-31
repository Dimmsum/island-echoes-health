# Patient Detail Page (`/patients`) — Untracked Data & Placeholders

> **Date:** 2026-08-31
> **Scope:** `webapp/app/patients/*` (the care-circle patient detail view, plus the "You"
> self-view). Lists every section that currently renders a visible "not tracked yet"
> placeholder instead of real data, why, and what's needed to back it for real.
>
> This is a narrower, implementation-level companion to
> `docs/PRODUCT_GAP_ANALYSIS.md` — that doc covers product-direction gaps across the
> whole platform; this one is scoped to exactly what's stubbed on this one page today.

---

## Why placeholders instead of fake data

Per project convention, the patient detail page shows real data wherever the backend
has it (blood pressure, weight, A1c, medication adherence, appointments, wallet,
follow-ups, status updates) and a **clearly labeled "not yet tracked" placeholder**
everywhere it doesn't — never a fabricated number. Each item below is exactly one of
those placeholders.

---

## 1. Heart rate & temperature

**Where:** `VitalsPanel.tsx` — two greyed, dashed-border stat tiles next to the real
BP/Weight/Adherence/A1c tiles.

**Current state:** `patient_metrics` (`supabase/migrations/00009_patient_metrics.sql`)
has no `heart_rate_bpm` or `temperature_c` column. There's no capture point for these
readings anywhere (web, mobile, or clinician portal).

**To implement:**
- Add `heart_rate_bpm integer` and `temperature_c numeric` columns to `patient_metrics`
  (new migration, `IF NOT EXISTS` guarded).
- Surface them in `getSponsoredPatient` / `getPatientMetrics` (`api/src/routes/home.ts`)
  select lists.
- Add input fields to wherever metrics are recorded today (clinician-portal appointment
  flow — check `AppointmentDetailClient.tsx` / clinician metrics form).
- Swap the two placeholder tiles in `VitalsPanel.tsx` for real tiles once data exists
  (mirror the Weight tile's sparkline + delta pattern).

---

## 2. Lab panel — LDL / HDL

**Where:** `PatientsPageClient.tsx` — the "Labs" card renders a real HbA1c bar (backed
by `patient_metrics.a1c`) alongside two greyed LDL/HDL rows.

**Current state:** No lab-panel table exists. `a1c` is the only lab-adjacent value
tracked, and it's a single column on `patient_metrics`, not a proper labs entity (no
draw date independent of the metrics row, no reference ranges, no arbitrary test types).

**To implement:**
- New `lab_results` table: `id, patient_id, panel_type (text), test_name, value,
  unit, reference_low, reference_high, drawn_at, recorded_by, created_at`. Generalizes
  past just LDL/HDL to any future lab type without more migrations.
- `GET /api/patients/:id/labs` — RLS-scoped read (mirrors `patient-status-updates.ts`'s
  pattern), `POST` for clinician/admin to record a result.
- Replace the hardcoded LDL/HDL rows in the Labs card with a mapped list over real
  results; keep the "not tracked" treatment for any test type that hasn't been
  recorded yet for that patient.

---

## 3. Medications list

**Where:** `PatientsPageClient.tsx` — the "Medications" card renders only "Medications
aren't tracked yet." `PatientTimelineTabs.tsx`'s "Medications" tab shows the same
generic placeholder message.

**Current state:** `patient_metrics.medication_adherence` is a single qualitative enum
(`good`/`fair`/`poor`) per visit — a proxy for *how well* a patient is taking their
meds, not a record of *what* they're taking. There is no medications table anywhere in
the schema.

**To implement:**
- New `medications` table: `id, patient_id, name, dosage, frequency, prescribed_by,
  started_at, ended_at (nullable — active if null), notes`.
- `GET /api/patients/:id/medications`, `POST`/`PATCH` for clinician/admin to
  prescribe/discontinue.
- Real Medications card: list of active meds (name, dosage, frequency) — this is the
  card the original design mockup ("Patients Page.dc.html") specified, with a per-med
  adherence pill; that adherence pill would need adherence tracked *per medication*
  rather than per visit, which is a bigger lift — worth scoping as a fast-follow once
  the medications list itself exists.

---

## 4. Conditions & allergies

**Where:** `PatientsPageClient.tsx` — patient header card, a single dashed pill:
"Conditions & allergies — not yet tracked."

**Current state:** No structured field on `profiles` or any other table for chronic
conditions or allergies. This is safety-relevant data (allergy info in particular), so
it shouldn't be freetext buried in a notes field long-term.

**To implement:**
- New `patient_conditions` table (`id, patient_id, label, type ('condition'|'allergy'),
  severity (nullable, for allergies), created_by, created_at`) rather than a single
  text column — supports multiple entries and lets the UI render them as the tag pills
  the original mockup showed ("Hypertension", "Type 2 diabetes", "Penicillin allergy").
- `GET /api/patients/:id/conditions`, clinician/admin-only write.
- Replace the placeholder pill with a real tag list once populated; keep the
  placeholder for patients with zero recorded entries (distinct from "no allergies" —
  consider whether the UI needs to distinguish "not asked yet" from "asked, none").

---

## 5. Care notes (tab)

**Where:** `PatientTimelineTabs.tsx` — "Care notes" tab shows the generic "isn't
tracked yet" placeholder.

**Current state:** `appointment_notes` *does* exist and is visit-scoped
(`note_type`: general/coordination/clinical_summary/discharge, from
`00035_structured_clinic_notes.sql`), but there's no endpoint that returns a patient's
notes across all their appointments in one call, and sponsors are RLS-blocked from
`coordination` notes by design.

**To implement:**
- `GET /api/patients/:id/notes` — joins `appointment_notes` across a patient's
  appointments, respecting existing RLS (sponsors only ever see what they're already
  allowed to see per-appointment).
- Render as a chronological list in the tab (date, note_type badge, content),
  reusing the note_type styling clinician-portal already has.

---

## 6. Billing (tab)

**Where:** `PatientTimelineTabs.tsx` — "Billing" tab shows the generic placeholder.

**Current state:** The wallet ledger (`wallet_transactions`) already covers top-ups and
deductions and is shown in the Wallet card — but there's no separate "billing" concept
(invoices, itemized charges tied to specific services/appointments beyond the wallet
transaction's free-text `description`).

**To implement:** Lower priority than the others — the Wallet card's transaction list
already covers most of what "billing" would show for this wallet-based payment model
(see `CLAUDE.md`'s Payment model section). Worth revisiting only if a need for
itemized invoices (vs. a flat wallet ledger) emerges; if so, this would piggyback on
whatever the Stripe/wallet reconciliation work looks like rather than needing a new
table on its own.

---

## 7. MRN & care team roster

**Where:** Dropped entirely from the current implementation (not shown as a
placeholder) — the original mockup's patient header showed an MRN and a "Care team:
Dr. R. Osei, N. Baptiste" line.

**Current state:** No MRN field exists (patients are identified by their `profiles.id`
UUID). "Care team" isn't modeled — `appointments.clinician_id` ties a clinician to a
single visit, but there's no persistent "this clinician is on this patient's team"
relationship.

**To implement (lower priority, likely needs product input first):**
- MRN: either generate a display-friendly identifier (e.g. a short code derived from
  the profile id) or treat this as out of scope if the org doesn't need one internally.
- Care team: new `patient_care_team` table (`patient_id, clinician_id, role_label,
  added_at`) if there's a real need to show a stable "assigned providers" list distinct
  from "clinicians who've had an appointment with this patient" (which could otherwise
  be derived from distinct `appointments.clinician_id` values with no new table).

---

## Suggested order

Roughly by (real clinical/safety value) ÷ (implementation cost):

1. **Conditions & allergies** — safety-relevant, small schema addition, no other
   feature depends on it.
2. **Medications list** — the most visually prominent placeholder (mockup gave it a
   dedicated card) and the request most likely to come up again.
3. **Lab panel (LDL/HDL + general)** — generalizing past `a1c` is a clean, self-contained
   table.
4. **Care notes tab** — mostly wiring; the underlying `appointment_notes` data already
   exists.
5. **Heart rate / temperature** — needs a capture workflow decision (who records these,
   from where) as much as a schema change.
6. **MRN / care team roster** — needs product input on whether either is actually
   wanted before building.
7. **Billing tab** — likely stays folded into the Wallet card; revisit only if a real
   itemized-billing need shows up.
