-- Add patient and sponsor to user_role enum for mobile sign-up
-- Add new enum values (run once; re-running will error if values exist)
alter type public.user_role add value 'patient';
alter type public.user_role add value 'sponsor';

-- Add sign-up profile columns (date_of_birth already exists from 00019)
alter table public.profiles
  add column if not exists phone text,
  add column if not exists organisation text,
  add column if not exists parish text;

-- Update trigger to set new profile fields from raw_user_meta_data
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
  user_phone text;
  user_date_of_birth date;
  user_organisation text;
  user_parish text;
begin
  user_role_value := coalesce(
    (new.raw_user_meta_data->>'role')::public.user_role,
    'user'
  );
  user_full_name := new.raw_user_meta_data->>'full_name';
  user_avatar_url := new.raw_user_meta_data->>'avatar_url';
  user_phone := new.raw_user_meta_data->>'phone';
  user_date_of_birth := (new.raw_user_meta_data->>'date_of_birth')::date;
  user_organisation := new.raw_user_meta_data->>'organisation';
  user_parish := new.raw_user_meta_data->>'parish';

  if not exists (select 1 from public.profiles where id = new.id) then
    begin
      insert into public.profiles (id, role, full_name, avatar_url, phone, date_of_birth, organisation, parish)
      values (
        new.id,
        user_role_value,
        user_full_name,
        user_avatar_url,
        user_phone,
        user_date_of_birth,
        user_organisation,
        user_parish
      );
    exception
      when unique_violation then
        raise notice 'Profile already exists for user %, skipping insert', new.id;
      when others then
        raise warning 'Failed to create profile for user %: %', new.id, sqlerrm;
        raise;
    end;
  else
    raise notice 'Profile already exists for user %, skipping insert', new.id;
  end if;

  return new;
end;
$$;
