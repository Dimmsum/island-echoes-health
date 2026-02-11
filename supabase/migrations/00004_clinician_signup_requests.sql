-- Clinician signup request status enum
create type public.clinician_request_status as enum ('pending', 'approved', 'rejected');

-- Pending clinician sign-up requests (no auth user until admin approves)
create table public.clinician_signup_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  license_number text not null,
  license_issuer text not null,
  specialty text not null,
  institution_or_clinic_name text,
  license_image_path text not null,
  status public.clinician_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  rejection_reason text
);

-- RLS: only admins can read and update; insert via service role in app
alter table public.clinician_signup_requests enable row level security;

create policy "Admins can read clinician signup requests"
  on public.clinician_signup_requests for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins can update clinician signup requests"
  on public.clinician_signup_requests for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Service role bypasses RLS for insert; no policy needed for insert from app.

-- RPC for admins to fetch pending requests
create or replace function public.get_pending_clinician_requests()
returns table (
  id uuid,
  email text,
  full_name text,
  license_number text,
  license_issuer text,
  specialty text,
  institution_or_clinic_name text,
  license_image_path text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ) then
    raise exception 'Not authorized';
  end if;

  return query
  select
    r.id,
    r.email,
    r.full_name,
    r.license_number,
    r.license_issuer,
    r.specialty,
    r.institution_or_clinic_name,
    r.license_image_path,
    r.created_at
  from public.clinician_signup_requests r
  where r.status = 'pending'
  order by r.created_at desc;
end;
$$;

-- Storage bucket for medical license images (private; access via signed URLs).
-- App uses service role (createClientAdmin) to upload and create signed URLs; service role bypasses RLS.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'clinician-licenses',
  'clinician-licenses',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;
