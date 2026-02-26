-- Fix: The insert policy on profiles blocks the trigger function from creating profiles
-- because auth.uid() is NULL when the trigger runs. Change the policy to allow inserts
-- when the id exists in auth.users (which is true when the trigger runs after user creation).

drop policy if exists "Enable insert for authenticated users only" on public.profiles;

-- Allow inserts when:
-- 1. The user is inserting their own profile (auth.uid() = id), OR
-- 2. The id exists in auth.users (allows trigger function to insert after user creation)
-- Note: In 'with check', column references refer to the row being inserted
create policy "Enable insert for authenticated users or trigger"
  on public.profiles for insert
  with check (
    auth.uid() = id
    or exists (
      select 1 from auth.users
      where auth.users.id = id
    )
  );
