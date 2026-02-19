-- Fix: The "Clinicians and admins can read profiles" policy was self-referential
-- (it queried profiles to check role, triggering RLS recursion) and broke clinician login.
-- Use a SECURITY DEFINER function to check staff role without RLS recursion.

create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('clinician', 'admin')
  );
$$;

grant execute on function public.is_staff() to authenticated;

-- Drop and recreate sponsor_patient_plans policy to use is_staff()
drop policy if exists "Clinicians and admins can read sponsor_patient_plans"
  on public.sponsor_patient_plans;

create policy "Clinicians and admins can read sponsor_patient_plans"
  on public.sponsor_patient_plans for select
  using (public.is_staff());

-- Drop and recreate profiles policy to use is_staff()
drop policy if exists "Clinicians and admins can read profiles"
  on public.profiles;

create policy "Clinicians and admins can read profiles"
  on public.profiles for select
  using (public.is_staff());
