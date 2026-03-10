-- Monthly subscription: store Stripe subscription id on plan link
alter table public.sponsor_patient_plans
  add column if not exists stripe_subscription_id text;

-- Stripe Price id per care plan (for subscriptions)
alter table public.care_plans
  add column if not exists stripe_price_id text;

create index if not exists idx_sponsor_patient_plans_stripe_subscription
  on public.sponsor_patient_plans(stripe_subscription_id)
  where stripe_subscription_id is not null;

comment on column public.sponsor_patient_plans.stripe_subscription_id is 'Stripe Subscription ID; cancel this to stop recurring billing';
comment on column public.care_plans.stripe_price_id is 'Stripe Price ID for recurring monthly subscription';
