-- Task 1.1: Collapse 3-tier care plan model into a single sponsorship and introduce patient wallets.
--
-- The new payment model is wallet-based: patients hold a wallet that any user (sponsor,
-- family member, etc.) can top up with any amount. There is no fixed subscription tier.
--
-- Dev-environment assumption: all existing sponsor_patient_plans,
-- sponsorship_consent_requests, and care_plans rows are test data and can be deleted.

-- ============================================================
-- STEP 1: Clear dependent data
-- Both tables hold care_plan_id NOT NULL with ON DELETE RESTRICT,
-- so we must remove referencing rows before deleting care_plans rows.
-- ============================================================

delete from public.sponsor_patient_plans;
delete from public.sponsorship_consent_requests;
delete from public.care_plans;

-- ============================================================
-- STEP 2: Insert the single simplified care plan row.
-- Kept as a reference anchor since FKs on the two tables above still point here.
-- price_cents is 0 — actual money flows through patient_wallets, not this table.
-- ============================================================

insert into public.care_plans (slug, name, price_cents, price_interval, description)
values (
  'sponsorship',
  'Island Echoes Sponsorship',
  0,
  'monthly',
  'Support a patient''s healthcare access. Contribute any amount to their care wallet.'
);

-- ============================================================
-- STEP 3: Drop tier-specific columns from care_plans.
-- These encoded per-tier service levels and Stripe price caching that no longer apply.
-- ============================================================

alter table public.care_plans
  drop column if exists visits_per_month,
  drop column if exists vitals_each_visit,
  drop column if exists chronic_labs_per_quarter,
  drop column if exists features,
  drop column if exists stripe_price_id;

-- ============================================================
-- STEP 4: Replace the unique index on sponsor_patient_plans.
-- 00029 created: unique (sponsor_id, patient_id, care_plan_id) WHERE ended_at IS NULL
-- With one plan, care_plan_id is no longer a meaningful dimension.
-- ============================================================

drop index if exists public.idx_sponsor_patient_plans_unique_active;

create unique index idx_sponsor_patient_plans_unique_active
  on public.sponsor_patient_plans(sponsor_id, patient_id)
  where ended_at is null;

comment on index public.idx_sponsor_patient_plans_unique_active
  is 'One active sponsorship per sponsor-patient pair. Ended historical rows can coexist.';

-- ============================================================
-- STEP 5: Patient wallet tables (new payment model).
-- ============================================================

-- One wallet per patient; balance must never go negative.
create table public.patient_wallets (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null unique references public.profiles(id) on delete cascade,
  balance_cents integer not null default 0 check (balance_cents >= 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.patient_wallets is 'Holds the current care wallet balance for each patient.';
comment on column public.patient_wallets.balance_cents is 'Running balance in cents; updated atomically on each transaction.';

-- Immutable ledger. Positive amount = top-up. Negative amount = deduction (future use).
create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.patient_wallets(id) on delete cascade,
  contributor_id uuid references public.profiles(id) on delete set null,
  amount_cents integer not null,
  description text,
  stripe_payment_intent_id text,
  created_at timestamptz default now()
);

comment on table public.wallet_transactions is 'Immutable ledger of all wallet top-ups and deductions.';
comment on column public.wallet_transactions.contributor_id is 'Profile that initiated the transaction; null if account was deleted.';
comment on column public.wallet_transactions.amount_cents is 'Positive for top-ups, negative for deductions.';

create index idx_wallet_transactions_wallet on public.wallet_transactions(wallet_id);
create index idx_wallet_transactions_contributor on public.wallet_transactions(contributor_id);
create index idx_wallet_transactions_stripe_pi on public.wallet_transactions(stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

-- ============================================================
-- STEP 6: Row-level security for wallet tables.
-- ============================================================

alter table public.patient_wallets enable row level security;
alter table public.wallet_transactions enable row level security;

-- Patient reads own wallet.
create policy "Patient reads own wallet"
  on public.patient_wallets for select
  to authenticated
  using (patient_id = auth.uid());

-- Linked sponsor reads sponsored patient's wallet.
create policy "Sponsor reads linked patient wallet"
  on public.patient_wallets for select
  to authenticated
  using (
    exists (
      select 1 from public.sponsor_patient_plans spp
      where spp.sponsor_id = auth.uid()
        and spp.patient_id = patient_wallets.patient_id
        and spp.ended_at is null
    )
  );

-- Clinician reads any patient's wallet they have an appointment with.
create policy "Clinician reads patient wallet"
  on public.patient_wallets for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'clinician'
    )
  );

-- Only the system (service role) may insert/update wallet rows directly.
-- Top-up logic will use a backend function that runs with elevated privileges.
create policy "Service role manages wallets"
  on public.patient_wallets for all
  to service_role
  using (true)
  with check (true);

-- Patient reads own transactions.
create policy "Patient reads own wallet transactions"
  on public.wallet_transactions for select
  to authenticated
  using (
    exists (
      select 1 from public.patient_wallets pw
      where pw.id = wallet_transactions.wallet_id
        and pw.patient_id = auth.uid()
    )
  );

-- Linked sponsor reads transactions on sponsored patient's wallet.
create policy "Sponsor reads linked patient wallet transactions"
  on public.wallet_transactions for select
  to authenticated
  using (
    exists (
      select 1 from public.patient_wallets pw
      join public.sponsor_patient_plans spp on spp.patient_id = pw.patient_id
      where pw.id = wallet_transactions.wallet_id
        and spp.sponsor_id = auth.uid()
        and spp.ended_at is null
    )
  );

-- Clinician reads transactions for any patient.
create policy "Clinician reads patient wallet transactions"
  on public.wallet_transactions for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'clinician'
    )
  );

-- Only service role may write transactions (backend handles inserts).
create policy "Service role manages wallet transactions"
  on public.wallet_transactions for all
  to service_role
  using (true)
  with check (true);
