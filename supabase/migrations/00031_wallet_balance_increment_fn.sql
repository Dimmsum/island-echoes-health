-- Atomic wallet balance increment called by the backend after a successful top-up.
-- Uses security definer so the service role can invoke it without needing direct
-- RLS write access on patient_wallets from the API process.

drop function if exists public.increment_wallet_balance(uuid, integer);

create or replace function public.increment_wallet_balance(
  p_wallet_id uuid,
  p_amount    integer
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.patient_wallets
  set balance_cents = balance_cents + p_amount,
      updated_at    = now()
  where id = p_wallet_id;
$$;

comment on function public.increment_wallet_balance(uuid, integer)
  is 'Atomically increments a patient wallet balance. Called by the API after a successful Stripe payment_intent.succeeded webhook.';
