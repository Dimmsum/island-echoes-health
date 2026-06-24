-- Priority 8.1: Structured Clinic Notes
-- Formalises appointment_notes.note_type as an enum, adds flag_for_follow_up,
-- and restricts sponsors from reading coordination (clinician-internal) notes.

-- 1. Create note_type enum (idempotent)
do $$ begin
  create type public.note_type as enum ('general', 'coordination', 'clinical_summary', 'discharge');
exception when duplicate_object then null;
end $$;

-- 2. Migrate note_type column from text → enum
--    Existing rows have value 'general' which maps cleanly to the enum.
alter table public.appointment_notes
  alter column note_type drop default;

alter table public.appointment_notes
  alter column note_type type public.note_type
  using note_type::public.note_type;

alter table public.appointment_notes
  alter column note_type set default 'general';

-- 3. Add flag_for_follow_up (used by 8.2+ to auto-create a follow-up task)
alter table public.appointment_notes
  add column if not exists flag_for_follow_up boolean not null default false;

-- 4. Update SELECT RLS policy — sponsors are blocked from coordination notes
drop policy if exists "Users can read notes for appointments they can see"
  on public.appointment_notes;

create policy "Users can read notes for appointments they can see"
  on public.appointment_notes for select
  using (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_notes.appointment_id
      and (
        a.patient_id = auth.uid()
        or a.clinician_id = auth.uid()
        or exists (
          select 1 from public.profiles
          where id = auth.uid() and role in ('admin', 'clinician')
        )
        -- sponsors may read all types except coordination (clinician-internal)
        or (
          appointment_notes.note_type != 'coordination'
          and exists (
            select 1 from public.sponsor_patient_plans spp
            where spp.patient_id = a.patient_id
              and spp.sponsor_id = auth.uid()
              and spp.ended_at is null
          )
        )
      )
    )
  );

-- 5. Add coordination_note to notification_type enum for admin alerts
alter type public.notification_type add value if not exists 'coordination_note';
