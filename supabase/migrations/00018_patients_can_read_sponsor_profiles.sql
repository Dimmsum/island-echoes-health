-- Allow patients to read profiles of their sponsors (people who have purchased
-- care plans for them). Enables the "Your sponsors" section on the patient dashboard.

create policy "Patients can read sponsor profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.sponsor_patient_plans spp
      where spp.patient_id = auth.uid()
        and spp.sponsor_id = profiles.id
        and spp.ended_at is null
    )
  );
