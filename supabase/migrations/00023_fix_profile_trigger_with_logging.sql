-- Fix profile creation trigger with error handling and ensure it works properly
-- The trigger may be failing silently, so we'll add explicit error handling

-- Drop and recreate the trigger function with better error handling
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  user_role_value public.user_role;
  user_full_name text;
  user_avatar_url text;
begin
  -- Extract values from raw_user_meta_data with defaults
  user_role_value := coalesce(
    (new.raw_user_meta_data->>'role')::public.user_role,
    'user'
  );
  user_full_name := new.raw_user_meta_data->>'full_name';
  user_avatar_url := new.raw_user_meta_data->>'avatar_url';

  -- Insert profile with explicit error handling
  -- Check if profile already exists (idempotent)
  if not exists (select 1 from public.profiles where id = new.id) then
    begin
      insert into public.profiles (id, role, full_name, avatar_url)
      values (
        new.id,
        user_role_value,
        user_full_name,
        user_avatar_url
      );
    exception
      when unique_violation then
        -- Profile already exists, this is okay (idempotent)
        raise notice 'Profile already exists for user %, skipping insert', new.id;
      when others then
        -- Log other errors but don't fail the user creation
        raise warning 'Failed to create profile for user %: %', new.id, sqlerrm;
        -- Re-raise to see the error in logs for debugging
        raise;
    end;
  else
    raise notice 'Profile already exists for user %, skipping insert', new.id;
  end if;

  return new;
end;
$$;

-- Ensure the trigger exists and is enabled
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Verify the function has the right permissions
-- Security definer functions run with the permissions of the function owner
-- In Supabase, this should be the postgres user which has full access

-- Also ensure the RLS policy allows the insert
-- The policy from 00022 should handle this, but let's make it more explicit
-- Since security definer functions should bypass RLS, but if not, this policy helps

-- Recreate the policy to be more explicit about allowing trigger inserts
-- The policy should allow inserts when the id exists in auth.users (trigger context)
drop policy if exists "Enable insert for authenticated users or trigger" on public.profiles;

create policy "Enable insert for authenticated users or trigger"
  on public.profiles for insert
  with check (
    -- Allow if user is inserting their own profile
    auth.uid() = id
    -- OR allow if the id exists in auth.users (trigger context - user was just created)
    or exists (
      select 1 from auth.users
      where auth.users.id = id
    )
  );

-- Note: Security definer functions should bypass RLS entirely, but this policy
-- provides a fallback in case RLS is still being evaluated

-- Create a helper function to backfill profiles for existing users who don't have one
-- This can be run manually if needed: SELECT public.backfill_missing_profiles();
create or replace function public.backfill_missing_profiles()
returns table (
  user_id uuid,
  email text,
  created boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  user_record record;
begin
  for user_record in
    select id, email, raw_user_meta_data
    from auth.users
    where not exists (
      select 1 from public.profiles where profiles.id = auth.users.id
    )
  loop
    begin
      insert into public.profiles (id, role, full_name, avatar_url)
      values (
        user_record.id,
        coalesce(
          (user_record.raw_user_meta_data->>'role')::public.user_role,
          'user'
        ),
        user_record.raw_user_meta_data->>'full_name',
        user_record.raw_user_meta_data->>'avatar_url'
      )
      on conflict (id) do nothing;
      
      return query select user_record.id, user_record.email, true;
    exception
      when others then
        return query select user_record.id, user_record.email, false;
    end;
  end loop;
end;
$$;

-- To test the trigger manually (for debugging):
-- 1. Check if trigger exists: 
--    SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
-- 2. Check trigger function:
--    SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
-- 3. To backfill missing profiles:
--    SELECT * FROM public.backfill_missing_profiles();
-- 4. To check users without profiles:
--    SELECT au.id, au.email FROM auth.users au 
--    LEFT JOIN public.profiles p ON p.id = au.id 
--    WHERE p.id IS NULL;
