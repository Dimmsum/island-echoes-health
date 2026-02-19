-- Allow patients and sponsors to read clinician/admin profiles (e.g. to show
-- "Appointment with Dr. Smith" when viewing appointments).
-- Uses SECURITY DEFINER to avoid self-referential RLS recursion.

create or replace function public.profile_is_staff(profile_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = profile_id and role in ('clinician', 'admin')
  );
$$;

grant execute on function public.profile_is_staff(uuid) to authenticated;

create policy "Users can read staff profiles"
  on public.profiles for select
  using (public.profile_is_staff(id));
