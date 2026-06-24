-- Task 3.1: Follow-up tracking as a standalone, trackable entity.
--
-- Until now "follow_up" was only a value in the appointment_service_type enum -- a tag
-- on an appointment, not something that could be created, assigned a due date, and closed.
-- This migration introduces follow_ups as first-class tasks: a clinician creates one
-- (optionally linked to a source appointment, or standalone), patients and their linked
-- family sponsors can read it, and overdue items can be surfaced on the care dashboard.
--
-- Design notes:
--   * "Overdue" is DERIVED, not stored: a row is overdue when status='pending' and
--     due_date < current_date. There is no 'overdue' enum value and no background job
--     is needed to keep it accurate.
--   * Writes go through the API service-role client only (clinician role is enforced by
--     backend middleware). RLS here only scopes reads, mirroring patient_wallets (00030).

-- ============================================================
-- STEP 1: Status enum.
-- Created only if absent so re-runs don't error once the type is referenced.
-- ============================================================

do $$ begin
  create type public.follow_up_status as enum ('pending', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;

-- ============================================================
-- STEP 2: follow_ups table.
-- Drop first so re-runs always produce the correct schema.
-- ============================================================

drop table if exists public.follow_ups;

create table public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  clinician_id uuid not null references public.profiles(id) on delete restrict,
  appointment_id uuid references public.appointments(id) on delete set null,
  due_date date not null,
  status public.follow_up_status not null default 'pending',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz
);

comment on table public.follow_ups is 'Standalone follow-up tasks created by clinicians for a patient; optionally linked to a source appointment.';
comment on column public.follow_ups.clinician_id is 'Clinician who created and owns the follow-up.';
comment on column public.follow_ups.appointment_id is 'Source appointment, if any. Nullable: follow-ups can be standalone, and the task survives appointment deletion (set null).';
comment on column public.follow_ups.status is 'pending | completed | cancelled. "Overdue" is derived (status=pending and due_date < current_date), never stored.';
comment on column public.follow_ups.completed_at is 'Set when status transitions to completed; null otherwise.';

-- ============================================================
-- STEP 3: Indexes.
-- Partial indexes support the common "open / overdue" dashboard queries.
-- ============================================================

create index idx_follow_ups_patient on public.follow_ups(patient_id);
create index idx_follow_ups_clinician on public.follow_ups(clinician_id);
create index idx_follow_ups_appointment on public.follow_ups(appointment_id)
  where appointment_id is not null;
create index idx_follow_ups_due_date on public.follow_ups(due_date)
  where status = 'pending';

-- ============================================================
-- STEP 4: Row-level security.
-- Reads scoped to patient / linked sponsor / clinician. All writes via service role.
-- ============================================================

alter table public.follow_ups enable row level security;

-- Drop policies before recreating so re-runs are safe.
drop policy if exists "Patient reads own follow-ups" on public.follow_ups;
drop policy if exists "Sponsor reads linked patient follow-ups" on public.follow_ups;
drop policy if exists "Clinician reads follow-ups" on public.follow_ups;
drop policy if exists "Service role manages follow-ups" on public.follow_ups;

-- Patient reads own follow-ups.
create policy "Patient reads own follow-ups"
  on public.follow_ups for select
  to authenticated
  using (patient_id = auth.uid());

-- Linked sponsor reads sponsored patient's follow-ups.
create policy "Sponsor reads linked patient follow-ups"
  on public.follow_ups for select
  to authenticated
  using (
    exists (
      select 1 from public.sponsor_patient_plans spp
      where spp.sponsor_id = auth.uid()
        and spp.patient_id = follow_ups.patient_id
        and spp.ended_at is null
    )
  );

-- Clinician reads any patient's follow-ups.
create policy "Clinician reads follow-ups"
  on public.follow_ups for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'clinician'
    )
  );

-- Only the system (service role) may insert/update/delete; backend enforces clinician role.
create policy "Service role manages follow-ups"
  on public.follow_ups for all
  to service_role
  using (true)
  with check (true);
