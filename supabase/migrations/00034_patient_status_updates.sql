-- Task 6.1: Patient status updates -- clinician-posted updates for the family/diaspora view.
--
-- Today a patient's health data exists only as point-in-time vitals on appointments; there
-- is no ongoing, human-readable status a clinician can post for the patient and their linked
-- family sponsors to follow. This migration introduces patient_status_updates: short text
-- updates a clinician (or admin) posts about a patient, each with a visibility that controls
-- whether the patient, the linked sponsors, or both can read it.
--
-- Design notes:
--   * Immutable feed: only created_at, no updated_at/deleted_at. Updates are append-only,
--     mirroring the wallet_transactions ledger (00030). There is no edit/delete path.
--   * Per-update visibility: 'all' (patient + sponsors), 'sponsor_only', or 'patient_only'.
--     RLS reads are visibility-aware so a patient never sees a sponsor_only note and a
--     sponsor never sees a patient_only note.
--   * Writes go through the API service-role client only (clinician/admin role is enforced by
--     backend middleware). RLS here only scopes reads, mirroring follow_ups (00033) and
--     patient_wallets (00030).

-- ============================================================
-- STEP 1: Visibility enum.
-- Created only if absent so re-runs don't error once the type is referenced.
-- ============================================================

do $$ begin
  create type public.status_update_visibility as enum ('all', 'sponsor_only', 'patient_only');
exception when duplicate_object then null;
end $$;

-- ============================================================
-- STEP 2: patient_status_updates table.
-- Drop first so re-runs always produce the correct schema.
-- ============================================================

drop table if exists public.patient_status_updates;

create table public.patient_status_updates (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  status_text text not null,
  visibility public.status_update_visibility not null default 'all',
  created_at timestamptz default now()
);

comment on table public.patient_status_updates is 'Append-only status updates a clinician/admin posts about a patient, readable by the patient and linked family sponsors per visibility.';
comment on column public.patient_status_updates.created_by is 'Clinician or admin who posted the update.';
comment on column public.patient_status_updates.visibility is 'all | sponsor_only | patient_only. Controls whether the patient, linked sponsors, or both can read the update.';

-- ============================================================
-- STEP 3: Indexes.
-- The composite (patient_id, created_at desc) serves the primary "latest updates for this
-- patient" feed query.
-- ============================================================

create index idx_patient_status_updates_patient on public.patient_status_updates(patient_id);
create index idx_patient_status_updates_created on public.patient_status_updates(patient_id, created_at desc);

-- ============================================================
-- STEP 4: Row-level security.
-- Reads scoped to patient / linked sponsor / clinician, filtered by visibility.
-- All writes via service role.
-- ============================================================

alter table public.patient_status_updates enable row level security;

-- Drop policies before recreating so re-runs are safe.
drop policy if exists "Patient reads own status updates" on public.patient_status_updates;
drop policy if exists "Sponsor reads linked patient status updates" on public.patient_status_updates;
drop policy if exists "Clinician reads status updates" on public.patient_status_updates;
drop policy if exists "Service role manages status updates" on public.patient_status_updates;

-- Patient reads own updates that are not sponsor-only.
create policy "Patient reads own status updates"
  on public.patient_status_updates for select
  to authenticated
  using (
    patient_id = auth.uid()
    and visibility in ('all', 'patient_only')
  );

-- Linked sponsor reads sponsored patient's updates that are not patient-only.
create policy "Sponsor reads linked patient status updates"
  on public.patient_status_updates for select
  to authenticated
  using (
    visibility in ('all', 'sponsor_only')
    and exists (
      select 1 from public.sponsor_patient_plans spp
      where spp.sponsor_id = auth.uid()
        and spp.patient_id = patient_status_updates.patient_id
        and spp.ended_at is null
    )
  );

-- Clinician reads any patient's updates, regardless of visibility.
create policy "Clinician reads status updates"
  on public.patient_status_updates for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'clinician'
    )
  );

-- Only the system (service role) may insert/update/delete; backend enforces clinician/admin role.
create policy "Service role manages status updates"
  on public.patient_status_updates for all
  to service_role
  using (true)
  with check (true);
