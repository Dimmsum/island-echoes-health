do $$ begin
  create type public.lab_panel_type as enum ('lipid_panel', 'metabolic_panel', 'other');
exception when duplicate_object then null;
end $$;

drop table if exists public.lab_results;

create table public.lab_results (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  panel_type public.lab_panel_type not null,
  test_name text not null,
  value numeric not null,
  unit text,
  reference_low numeric,
  reference_high numeric,
  drawn_at date not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz default now()
);

comment on table public.lab_results is 'Individual lab test results for a patient, recorded by a clinician or admin. Immutable — corrections are new rows.';
comment on column public.lab_results.test_name is 'Free-text analyte name (e.g. "LDL", "HDL") so new lab types never require a migration.';

create index idx_lab_results_patient on public.lab_results(patient_id, drawn_at desc);

alter table public.lab_results enable row level security;

drop policy if exists "Patient reads own lab results" on public.lab_results;
drop policy if exists "Sponsor reads linked patient lab results" on public.lab_results;
drop policy if exists "Clinician and admin read lab results" on public.lab_results;
drop policy if exists "Service role manages lab results" on public.lab_results;

create policy "Patient reads own lab results"
  on public.lab_results for select
  to authenticated
  using (patient_id = auth.uid());

create policy "Sponsor reads linked patient lab results"
  on public.lab_results for select
  to authenticated
  using (
    exists (
      select 1 from public.sponsor_patient_plans spp
      where spp.sponsor_id = auth.uid()
        and spp.patient_id = lab_results.patient_id
        and spp.ended_at is null
    )
  );

create policy "Clinician and admin read lab results"
  on public.lab_results for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('clinician', 'admin')
    )
  );

create policy "Service role manages lab results"
  on public.lab_results for all
  to service_role
  using (true)
  with check (true);
