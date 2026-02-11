-- Remove license_issuer column (removed from sign-up form)
alter table public.clinician_signup_requests
  drop column if exists license_issuer;

-- Recreate RPC without license_issuer
create or replace function public.get_pending_clinician_requests()
returns table (
  id uuid,
  email text,
  full_name text,
  license_number text,
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
    r.specialty,
    r.institution_or_clinic_name,
    r.license_image_path,
    r.created_at
  from public.clinician_signup_requests r
  where r.status = 'pending'
  order by r.created_at desc;
end;
$$;
