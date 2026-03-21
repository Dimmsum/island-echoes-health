-- Stripe hardening: idempotent webhook processing and active-link uniqueness.

-- 1) Track processed Stripe webhook events so retries are safe and side effects are idempotent.
create table if not exists public.stripe_webhook_events (
  id text primary key,
  type text not null,
  stripe_created_at timestamptz,
  received_at timestamptz not null default now()
);

comment on table public.stripe_webhook_events is 'Processed Stripe webhook events (by event.id) for idempotency';
comment on column public.stripe_webhook_events.id is 'Stripe event id';
comment on column public.stripe_webhook_events.type is 'Stripe event type';
comment on column public.stripe_webhook_events.stripe_created_at is 'Event created timestamp reported by Stripe';
comment on column public.stripe_webhook_events.received_at is 'When API persisted this event';

-- 2) Allow re-sponsoring the same patient+plan after prior sponsorship has ended.
-- Previous global uniqueness on (sponsor_id, patient_id, care_plan_id) blocked historical re-subscribe.
alter table public.sponsor_patient_plans
  drop constraint if exists sponsor_patient_plans_sponsor_id_patient_id_care_plan_id_key;

-- Only one active link is allowed at a time; ended historical links can coexist.
create unique index if not exists idx_sponsor_patient_plans_unique_active
  on public.sponsor_patient_plans(sponsor_id, patient_id, care_plan_id)
  where ended_at is null;
