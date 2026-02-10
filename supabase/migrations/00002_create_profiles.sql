-- Profiles table linked to auth.users with role
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'user',
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile (except role - controlled by admin)
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Allow insert only via trigger (handle_new_user)
create policy "Enable insert for authenticated users only"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Trigger function: create profile on signup with role from raw_user_meta_data
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, full_name, avatar_url)
  values (
    new.id,
    coalesce(
      (new.raw_user_meta_data->>'role')::public.user_role,
      'user'
    ),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- Trigger on auth.users insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
