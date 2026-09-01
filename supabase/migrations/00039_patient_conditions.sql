do $$ begin
  create type public.patient_condition_type as enum ('condition', 'allergy');
exception when duplicate_object then null;
end $$;

drop table if exists public.patient_conditions;

create table public.patient_conditions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  type public.patient_condition_type not null,
  severity text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz default now()
);

comment on table public.patient_conditions is 'Structured conditions and allergies recorded for a patient by a clinician or admin.';
comment on column public.patient_conditions.severity is 'Free-text severity, primarily for allergies (e.g. "mild", "anaphylaxis"). Nullable — not applicable to most conditions.';

create index idx_patient_conditions_patient on public.patient_conditions(patient_id, created_at desc);

alter table public.patient_conditions enable row level security;

drop policy if exists "Patient reads own conditions" on public.patient_conditions;
drop policy if exists "Sponsor reads linked patient conditions" on public.patient_conditions;
drop policy if exists "Clinician and admin read conditions" on public.patient_conditions;
drop policy if exists "Service role manages conditions" on public.patient_conditions;

create policy "Patient reads own conditions"
  on public.patient_conditions for select
  to authenticated
  using (patient_id = auth.uid());

create policy "Sponsor reads linked patient conditions"
  on public.patient_conditions for select
  to authenticated
  using (
    exists (
      select 1 from public.sponsor_patient_plans spp
      where spp.sponsor_id = auth.uid()
        and spp.patient_id = patient_conditions.patient_id
        and spp.ended_at is null
    )
  );

create policy "Clinician and admin read conditions"
  on public.patient_conditions for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('clinician', 'admin')
    )
  );

create policy "Service role manages conditions"
  on public.patient_conditions for all
  to service_role
  using (true)
  with check (true);
