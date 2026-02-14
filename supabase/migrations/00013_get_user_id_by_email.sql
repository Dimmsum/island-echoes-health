-- For server-side use only (e.g. create notification for patient by email).
-- Call with service role or from security definer context.
create or replace function public.get_user_id_by_email(e text)
returns uuid
language sql
security definer
set search_path = ''
stable
as $$
  select id from auth.users where email = lower(trim(e)) limit 1;
$$;
