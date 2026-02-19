-- Consent request status
create type public.consent_request_status as enum ('pending', 'accepted', 'declined');

-- Sponsorship consent requests (sponsor purchases for patient by email)
create table public.sponsorship_consent_requests (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null references public.profiles(id) on delete cascade,
  patient_email text not null,
  patient_id uuid references public.profiles(id) on delete set null,
  care_plan_id uuid not null references public.care_plans(id) on delete restrict,
  status public.consent_request_status not null default 'pending',
  payment_simulated_at timestamptz,
  created_at timestamptz default now(),
  responded_at timestamptz,
  decline_reason text
);

-- Active sponsor-patient-plan link (after patient accepts)
create table public.sponsor_patient_plans (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null references public.profiles(id) on delete cascade,
  patient_id uuid not null references public.profiles(id) on delete cascade,
  care_plan_id uuid not null references public.care_plans(id) on delete restrict,
  consent_request_id uuid references public.sponsorship_consent_requests(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  unique (sponsor_id, patient_id, care_plan_id)
);

create index idx_sponsorship_consent_requests_sponsor on public.sponsorship_consent_requests(sponsor_id);
create index idx_sponsorship_consent_requests_patient_email on public.sponsorship_consent_requests(patient_email);
create index idx_sponsorship_consent_requests_patient_id on public.sponsorship_consent_requests(patient_id);
create index idx_sponsorship_consent_requests_status on public.sponsorship_consent_requests(status);

create index idx_sponsor_patient_plans_sponsor on public.sponsor_patient_plans(sponsor_id);
create index idx_sponsor_patient_plans_patient on public.sponsor_patient_plans(patient_id);
create index idx_sponsor_patient_plans_ended_at on public.sponsor_patient_plans(ended_at) where ended_at is null;
