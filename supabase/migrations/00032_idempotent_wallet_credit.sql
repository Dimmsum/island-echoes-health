-- Idempotent wallet top-up crediting.
--
-- The wallet was previously credited only inside the Stripe webhook
-- (payment_intent.succeeded). To allow a synchronous confirm endpoint to credit
-- the wallet directly after client-side payment confirmation — while keeping the
-- production webhook as the source of truth — crediting must be idempotent so the
-- same PaymentIntent can never be applied twice.

-- ============================================================
-- STEP 1: Guard against double-crediting the same PaymentIntent.
-- ============================================================

create unique index if not exists idx_wallet_tx_unique_pi
  on public.wallet_transactions(stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

-- ============================================================
-- STEP 2: Atomic credit function — inserts the ledger row and bumps the balance
-- in one transaction. Returns false (no-op) if the PaymentIntent was already
-- recorded. Supersedes increment_wallet_balance for top-ups.
-- ============================================================

drop function if exists public.credit_wallet_topup(uuid, integer, uuid, text);

create or replace function public.credit_wallet_topup(
  p_wallet_id           uuid,
  p_amount              integer,
  p_contributor_id      uuid,
  p_payment_intent_id   text
)
returns boolean             -- true = credited, false = already recorded (no-op)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exists boolean;
begin
  select exists(
    select 1 from public.wallet_transactions
    where stripe_payment_intent_id = p_payment_intent_id
  ) into v_exists;

  if v_exists then
    return false;
  end if;

  insert into public.wallet_transactions
    (wallet_id, contributor_id, amount_cents, description, stripe_payment_intent_id)
  values
    (p_wallet_id, p_contributor_id, p_amount, 'Wallet top-up', p_payment_intent_id);

  update public.patient_wallets
  set balance_cents = balance_cents + p_amount,
      updated_at    = now()
  where id = p_wallet_id;

  return true;
end;
$$;

comment on function public.credit_wallet_topup(uuid, integer, uuid, text)
  is 'Atomically records a wallet top-up and increments the balance. Idempotent on stripe_payment_intent_id — returns false if already applied. Called by both POST /api/wallet/topup/confirm and the payment_intent.succeeded webhook.';
