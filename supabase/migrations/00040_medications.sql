drop table if exists public.medications;

create table public.medications (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  dosage text,
  frequency text,
  prescribed_by text,
  started_at date not null default current_date,
  ended_at date,
  notes text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz default now()
);

comment on table public.medications is 'Medications a patient is (or was) taking, recorded by a clinician or admin.';
comment on column public.medications.prescribed_by is 'Free-text prescriber name — may be an outside doctor, not necessarily a platform user.';
comment on column public.medications.ended_at is 'Null means the medication is currently active.';

create index idx_medications_patient on public.medications(patient_id, created_at desc);

alter table public.medications enable row level security;

drop policy if exists "Patient reads own medications" on public.medications;
drop policy if exists "Sponsor reads linked patient medications" on public.medications;
drop policy if exists "Clinician and admin read medications" on public.medications;
drop policy if exists "Service role manages medications" on public.medications;

create policy "Patient reads own medications"
  on public.medications for select
  to authenticated
  using (patient_id = auth.uid());

create policy "Sponsor reads linked patient medications"
  on public.medications for select
  to authenticated
  using (
    exists (
      select 1 from public.sponsor_patient_plans spp
      where spp.sponsor_id = auth.uid()
        and spp.patient_id = medications.patient_id
        and spp.ended_at is null
    )
  );

create policy "Clinician and admin read medications"
  on public.medications for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('clinician', 'admin')
    )
  );

create policy "Service role manages medications"
  on public.medications for all
  to service_role
  using (true)
  with check (true);
