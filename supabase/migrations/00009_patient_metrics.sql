-- Medication adherence enum
create type public.medication_adherence as enum ('good', 'fair', 'poor');

-- Patient metrics (recorded by clinician per visit or standalone)
create table public.patient_metrics (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  recorded_at timestamptz not null default now(),
  blood_pressure_systolic integer,
  blood_pressure_diastolic integer,
  weight_kg numeric(5,2),
  a1c numeric(4,2),
  medication_adherence public.medication_adherence
);

create index idx_patient_metrics_patient on public.patient_metrics(patient_id);
create index idx_patient_metrics_appointment on public.patient_metrics(appointment_id);
create index idx_patient_metrics_recorded_at on public.patient_metrics(recorded_at);
