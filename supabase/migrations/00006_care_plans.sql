-- Care plans reference table
create table public.care_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  price_cents integer not null,
  price_interval text not null default 'monthly',
  visits_per_month integer not null,
  vitals_each_visit boolean not null default true,
  chronic_labs_per_quarter integer not null default 0,
  description text,
  features text[],
  created_at timestamptz default now()
);

alter table public.care_plans enable row level security;

-- Care plans are read-only for all authenticated users
create policy "Authenticated users can read care plans"
  on public.care_plans for select
  to authenticated
  using (true);

-- Seed the three plans
insert into public.care_plans (slug, name, price_cents, visits_per_month, chronic_labs_per_quarter, description, features)
values
  (
    'core_wellness',
    'Core Wellness',
    7500,
    1,
    0,
    'Basic wellness and follow-ups. Vitals taken each visit. Labs not included.',
    array['1 clinic visit per month', 'Vitals taken each visit', 'Labs not included', 'Basic wellness and follow-ups']
  ),
  (
    'chronic_care',
    'Chronic Care',
    12000,
    1,
    1,
    'Basic wellness, diabetes, hypertension. 1 chronic lab per quarter.',
    array['1 clinic visit per month', 'Vitals taken each visit', '1 chronic lab per quarter', 'Basic wellness, diabetes, hypertension']
  ),
  (
    'premium_coordination',
    'Premium Coordination',
    18000,
    2,
    1,
    'Extra coordination and support. 2 visits per month.',
    array['2 clinic visits per month', 'Vitals taken each visit', '1 chronic lab per quarter', 'Extra coordination and support']
  );
