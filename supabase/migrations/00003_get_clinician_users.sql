-- RPC for admins to fetch clinician users with email
-- Requires current user to have role 'admin' in profiles
create or replace function public.get_clinician_users()
returns table (
  id uuid,
  full_name text,
  email text,
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
    p.id,
    p.full_name,
    u.email::text,
    p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.role = 'clinician'
  order by p.created_at desc;
end;
$$;
