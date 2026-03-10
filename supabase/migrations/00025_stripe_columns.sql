-- Stripe integration: store customer and payment method IDs for sponsorship payments

alter table public.profiles
  add column if not exists stripe_customer_id text;

alter table public.sponsorship_consent_requests
  add column if not exists stripe_payment_method_id text,
  add column if not exists stripe_payment_intent_id text;

comment on column public.profiles.stripe_customer_id is 'Stripe Customer ID for reuse across sponsorship payments';
comment on column public.sponsorship_consent_requests.stripe_payment_method_id is 'Stripe PaymentMethod ID to charge when patient accepts';
comment on column public.sponsorship_consent_requests.stripe_payment_intent_id is 'Stripe PaymentIntent ID after successful charge on accept';
