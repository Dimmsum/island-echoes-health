-- Clinicians and admins can read sponsor_patient_plans (to list patients with purchased plans)
create policy "Clinicians and admins can read sponsor_patient_plans"
  on public.sponsor_patient_plans for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('clinician', 'admin')
    )
  );

-- Clinicians and admins can read profiles (to display patient names)
create policy "Clinicians and admins can read profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('clinician', 'admin')
    )
  );
