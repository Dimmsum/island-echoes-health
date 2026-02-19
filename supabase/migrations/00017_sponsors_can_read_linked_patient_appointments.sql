-- Sponsors can read appointments for patients they sponsor (via active sponsor_patient_plans).
-- Without this, sponsors see "No appointments yet" on the sponsored patient page even when
-- appointments exist.

create policy "Sponsors can read appointments for linked patients"
  on public.appointments for select
  using (
    exists (
      select 1 from public.sponsor_patient_plans spp
      where spp.patient_id = appointments.patient_id
        and spp.sponsor_id = auth.uid()
        and spp.ended_at is null
    )
  );
