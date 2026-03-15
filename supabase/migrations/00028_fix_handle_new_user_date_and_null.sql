-- Fix handle_new_user: safe handling of null/empty date_of_birth and optional fields
-- (empty string ::date throws "invalid input syntax for type date" in PostgreSQL)
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
  raw_dob text;
begin
  user_role_value := coalesce(
    (new.raw_user_meta_data->>'role')::public.user_role,
    'user'
  );
  user_full_name := new.raw_user_meta_data->>'full_name';
  user_avatar_url := new.raw_user_meta_data->>'avatar_url';
  user_phone := nullif(trim(new.raw_user_meta_data->>'phone'), '');
  user_organisation := nullif(trim(new.raw_user_meta_data->>'organisation'), '');
  user_parish := nullif(trim(new.raw_user_meta_data->>'parish'), '');

  raw_dob := nullif(trim(new.raw_user_meta_data->>'date_of_birth'), '');
  if raw_dob is not null then
    begin
      user_date_of_birth := raw_dob::date;
    exception
      when others then
        user_date_of_birth := null;
    end;
  else
    user_date_of_birth := null;
  end if;

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
