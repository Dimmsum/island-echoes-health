-- RLS for sponsorship_consent_requests
alter table public.sponsorship_consent_requests enable row level security;

create policy "Sponsors can read own consent requests"
  on public.sponsorship_consent_requests for select
  using (sponsor_id = auth.uid());

create policy "Patients can read consent requests for them"
  on public.sponsorship_consent_requests for select
  using (patient_id = auth.uid());

create policy "Sponsors can insert consent requests"
  on public.sponsorship_consent_requests for insert
  with check (sponsor_id = auth.uid());

create policy "Patients can update consent requests to accept or decline"
  on public.sponsorship_consent_requests for update
  using (patient_id = auth.uid());

-- Service role / backend will need to set patient_id on signup; use service role or a trigger
-- Allow update for patient_id backfill: only allow when current user is the one being linked (patient)
-- Actually backfill will be done in a trigger with security definer, so no policy needed for that.

-- RLS for sponsor_patient_plans
alter table public.sponsor_patient_plans enable row level security;

create policy "Sponsors can read own sponsor_patient_plans"
  on public.sponsor_patient_plans for select
  using (sponsor_id = auth.uid());

create policy "Patients can read their sponsor_patient_plans"
  on public.sponsor_patient_plans for select
  using (patient_id = auth.uid());

create policy "Patients can insert sponsor_patient_plans when accepting consent"
  on public.sponsor_patient_plans for insert
  with check (patient_id = auth.uid());

-- Only system/patient can insert; update for ended_at could be sponsor or patient later - skip for MVP

-- RLS for appointments
alter table public.appointments enable row level security;

create policy "Patients can read own appointments"
  on public.appointments for select
  using (patient_id = auth.uid());

create policy "Clinicians and admins can read all appointments"
  on public.appointments for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('clinician', 'admin')
    )
  );

create policy "Clinicians and admins can insert appointments"
  on public.appointments for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('clinician', 'admin')
    )
  );

create policy "Clinicians and admins can update appointments"
  on public.appointments for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('clinician', 'admin')
    )
  );

-- RLS for appointment_notes: patient and their sponsors and clinician can read
alter table public.appointment_notes enable row level security;

create policy "Users can read notes for appointments they can see"
  on public.appointment_notes for select
  using (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_notes.appointment_id
      and (
        a.patient_id = auth.uid()
        or a.clinician_id = auth.uid()
        or exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'clinician'))
        or exists (select 1 from public.sponsor_patient_plans spp where spp.patient_id = a.patient_id and spp.sponsor_id = auth.uid() and spp.ended_at is null)
      )
    )
  );

create policy "Clinicians can insert appointment notes"
  on public.appointment_notes for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('clinician', 'admin'))
  );

create policy "Clinicians can update own appointment notes"
  on public.appointment_notes for update
  using (created_by = auth.uid() or created_by is null);

-- RLS for appointment_services
alter table public.appointment_services enable row level security;

create policy "Users can read services for appointments they can see"
  on public.appointment_services for select
  using (
    exists (
      select 1 from public.appointments a
      where a.id = appointment_services.appointment_id
      and (
        a.patient_id = auth.uid()
        or a.clinician_id = auth.uid()
        or exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'clinician'))
        or exists (select 1 from public.sponsor_patient_plans spp where spp.patient_id = a.patient_id and spp.sponsor_id = auth.uid() and spp.ended_at is null)
      )
    )
  );

create policy "Clinicians can manage appointment services"
  on public.appointment_services for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('clinician', 'admin'))
  );

-- RLS for patient_metrics: clinician write; patient and sponsors read
alter table public.patient_metrics enable row level security;

create policy "Patients can read own metrics"
  on public.patient_metrics for select
  using (patient_id = auth.uid());

create policy "Sponsors can read metrics of linked patients"
  on public.patient_metrics for select
  using (
    exists (
      select 1 from public.sponsor_patient_plans spp
      where spp.patient_id = patient_metrics.patient_id and spp.sponsor_id = auth.uid() and spp.ended_at is null
    )
  );

create policy "Clinicians and admins can read all metrics"
  on public.patient_metrics for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('clinician', 'admin'))
  );

create policy "Clinicians can insert patient metrics"
  on public.patient_metrics for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('clinician', 'admin'))
  );

-- RLS for notifications
alter table public.notifications enable row level security;

create policy "Users can read own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "Users can update own notifications (mark read)"
  on public.notifications for update
  using (user_id = auth.uid());

-- Insert: only backend/service role or via secure function. We'll create notifications from server actions with service role or we need a function.
-- For MVP we can use a security definer function to create notifications, or allow insert when reference_id is a consent_request the user owns (sponsor) - complex.
-- Simpler: create notifications from server actions using createClientAdmin() so service role bypasses RLS. So no insert policy for authenticated users; app uses admin client for inserts.
