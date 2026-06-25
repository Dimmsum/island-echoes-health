"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { createTopupIntent, confirmTopup } from "./actions";
import type { WalletTransaction } from "./WalletCard";

type Props = {
  walletId: string;
  balanceCents: number;
  transactions: WalletTransaction[];
  patientId: string;
  viewerId: string | null;
};

function fmt(cents: number) {
  return `$${(Math.abs(cents) / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

function txLabel(tx: WalletTransaction, viewerId: string | null) {
  if (tx.amount_cents < 0) return tx.description ?? "Deduction";
  if (tx.contributor_id && viewerId && tx.contributor_id === viewerId) return "You";
  if (tx.contributor_name) return tx.contributor_name;
  return tx.description ?? "Wallet top-up";
}

function txIconLetter(tx: WalletTransaction): string {
  const label = txLabel(tx, null);
  return label.slice(0, 2).toUpperCase();
}

function PaymentForm({
  amountDollars,
  paymentIntentId,
  onSuccess,
  onCancel,
}: {
  amountDollars: number;
  paymentIntentId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError(null);
    setPending(true);
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/home` },
      redirect: "if_required",
    });
    if (stripeError) {
      setPending(false);
      setError(stripeError.message ?? "Payment failed.");
      return;
    }
    const result = await confirmTopup(paymentIntentId);
    setPending(false);
    if (result.error) {
      setError(`Payment succeeded but crediting failed: ${result.error}`);
      return;
    }
    router.refresh();
    onSuccess();
  }

  return (
    <form onSubmit={handleConfirm} className="space-y-3">
      <PaymentElement options={{ layout: "tabs" }} />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending || !stripe || !elements}
          className="flex-1 rounded-[10px] bg-[#1F8A5B] py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          {pending ? "Processing…" : `Confirm ${fmt(Math.round(amountDollars * 100))}`}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[10px] border border-[#DCE4DD] bg-white px-3 py-2 text-sm font-medium text-[#16241D]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function CompactWallet({ walletId: _walletId, balanceCents, transactions, patientId, viewerId }: Props) {
  const [showTopup, setShowTopup] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function reset() {
    setShowTopup(false);
    setAmount("");
    setLoading(false);
    setIntentError(null);
    setClientSecret(null);
    setPaymentIntentId(null);
  }

  async function handleCreateIntent(e: React.FormEvent) {
    e.preventDefault();
    setIntentError(null);
    const dollars = parseFloat(amount);
    if (!dollars || dollars < 1) { setIntentError("Min $1.00"); return; }
    const cents = Math.round(dollars * 100);
    setLoading(true);
    const result = await createTopupIntent(patientId, cents);
    setLoading(false);
    if (result.error) { setIntentError(result.error); return; }
    if ("clientSecret" in result) {
      setClientSecret(result.clientSecret);
      setPaymentIntentId(result.paymentIntentId);
    }
  }

  const monoStyle = { fontFamily: "var(--font-ibm-mono, 'IBM Plex Mono', monospace)" };

  return (
    <div
      className="flex flex-col rounded-2xl border border-[#E9EEE9] bg-white p-5"
      style={{ fontFamily: "var(--font-hanken, 'Hanken Grotesk', sans-serif)" }}
    >
      <div style={monoStyle} className="text-[11px] uppercase tracking-[.12em] text-[#8a988f]">
        Wallet
      </div>

      <div className="mt-3.5 text-[13px] text-[#6a7a70]">Current balance</div>
      <div className="mt-0.5 text-[32px] font-extrabold leading-none tracking-[-0.025em] text-[#16241D]">
        {fmt(balanceCents)}
      </div>

      {success && (
        <div className="mt-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-800">
          Funds added successfully!
        </div>
      )}

      {!showTopup ? (
        <div className="mt-4 flex gap-2.5">
          <button
            type="button"
            onClick={() => { setShowTopup(true); setSuccess(false); }}
            className="flex-1 rounded-[10px] bg-[#1F8A5B] py-2.5 text-[13px] font-semibold text-white"
          >
            Add funds
          </button>
          <button
            type="button"
            className="flex-1 rounded-[10px] border border-[#DCE4DD] bg-white py-2.5 text-[13px] font-semibold text-[#16241D]"
          >
            Send
          </button>
        </div>
      ) : clientSecret && paymentIntentId ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
          <Elements stripe={getStripe()} options={{ clientSecret, appearance: { theme: "stripe" } }}>
            <PaymentForm
              amountDollars={parseFloat(amount)}
              paymentIntentId={paymentIntentId}
              onSuccess={() => { setSuccess(true); reset(); }}
              onCancel={reset}
            />
          </Elements>
        </div>
      ) : (
        <form onSubmit={handleCreateIntent} className="mt-4 rounded-xl border border-[#E6EBE6] p-3">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-sm font-semibold text-[#16241D]">Add funds</span>
            <button type="button" onClick={reset} className="text-[#9aa89f] hover:text-[#5a6a60]">✕</button>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-[#6a7a70]">$</span>
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-[9px] border border-[#E6EBE6] py-2 pl-7 pr-3 text-sm text-[#16241D] placeholder:text-[#9aa89f] focus:border-[#1F8A5B] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !amount}
              className="rounded-[9px] bg-[#1F8A5B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
            >
              {loading ? "…" : "Next"}
            </button>
          </div>
          {intentError && <p className="mt-1.5 text-xs text-red-600">{intentError}</p>}
        </form>
      )}

      <div className="my-4 h-px bg-[#EEF2EE]" />

      <div style={monoStyle} className="mb-3.5 text-[11px] uppercase tracking-[.12em] text-[#8a988f]">
        Recent activity
      </div>

      {transactions.length === 0 ? (
        <p className="text-sm text-[#9aa89f]">No transactions yet.</p>
      ) : (
        <div className="flex flex-col gap-3.5">
          {transactions.slice(0, 4).map((tx) => (
            <div key={tx.id} className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#E7ECE8] text-[11px] font-bold text-[#4a5a50]">
                {txIconLetter(tx)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-[#16241D]">{txLabel(tx, viewerId)}</div>
                <div className="text-[11.5px] text-[#94a298]">
                  {new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
              </div>
              <div
                className={`shrink-0 text-[13px] font-bold ${tx.amount_cents >= 0 ? "text-[#1F8A5B]" : "text-[#16241D]"}`}
              >
                {tx.amount_cents >= 0 ? "+" : "−"}{fmt(tx.amount_cents)}
              </div>
            </div>
          ))}
        </div>
      )}

      {transactions.length > 0 && (
        <div className="mt-4 text-center text-[12px] font-semibold text-[#1F8A5B]">
          View all transactions
        </div>
      )}
    </div>
  );
}
