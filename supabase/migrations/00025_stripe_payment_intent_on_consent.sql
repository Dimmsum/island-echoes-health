-- Store Stripe PaymentIntent id for sponsorship consent requests (sandbox/live)
alter table public.sponsorship_consent_requests
  add column if not exists stripe_payment_intent_id text unique;

create index if not exists idx_sponsorship_consent_requests_stripe_pi
  on public.sponsorship_consent_requests(stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

comment on column public.sponsorship_consent_requests.stripe_payment_intent_id is 'Stripe PaymentIntent id; when payment_intent.succeeded webhook fires, we set payment_simulated_at';
