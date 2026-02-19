-- Appointment status
create type public.appointment_status as enum ('scheduled', 'completed', 'no_show', 'cancelled');

-- Appointments
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  clinician_id uuid not null references public.profiles(id) on delete restrict,
  scheduled_at timestamptz not null,
  status public.appointment_status not null default 'scheduled',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_appointments_patient on public.appointments(patient_id);
create index idx_appointments_clinician on public.appointments(clinician_id);
create index idx_appointments_scheduled_at on public.appointments(scheduled_at);

-- Appointment notes (visit summaries / next steps visible to sponsors)
create table public.appointment_notes (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  content text not null,
  note_type text default 'general',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create index idx_appointment_notes_appointment on public.appointment_notes(appointment_id);

-- Service type enum for appointment services
create type public.appointment_service_type as enum (
  'vitals',
  'chronic_lab',
  'wellness_check',
  'follow_up',
  'coordination'
);

-- Services used during an appointment
create table public.appointment_services (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  service_type public.appointment_service_type not null,
  details text,
  created_at timestamptz default now()
);

create index idx_appointment_services_appointment on public.appointment_services(appointment_id);
