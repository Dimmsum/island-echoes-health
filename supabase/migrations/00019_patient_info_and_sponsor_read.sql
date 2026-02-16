-- Add date_of_birth to profiles so sponsors can see patient age.
alter table public.profiles
  add column if not exists date_of_birth date;

-- Allow sponsors to read profiles of patients they sponsor (via active sponsor_patient_plans).
-- Enables sponsors to see patient name, age, etc. on the sponsored patient page.
create policy "Sponsors can read linked patient profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.sponsor_patient_plans spp
      where spp.patient_id = profiles.id
        and spp.sponsor_id = auth.uid()
        and spp.ended_at is null
    )
  );
