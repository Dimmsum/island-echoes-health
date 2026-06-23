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

export type WalletTransaction = {
  id: string;
  amount_cents: number;
  description: string | null;
  created_at: string;
  contributor_id: string | null;
  contributor_name: string | null;
};

type Props = {
  walletId: string;
  balanceCents: number;
  transactions: WalletTransaction[];
  patientId: string;
  viewerId: string | null;
};

function topupLabel(tx: WalletTransaction, viewerId: string | null) {
  if (tx.amount_cents < 0) return tx.description ?? "Deduction";
  if (tx.contributor_id && viewerId && tx.contributor_id === viewerId)
    return "You";
  if (tx.contributor_name) return `${tx.contributor_name}`;
  return tx.description ?? "Wallet top-up";
}

const WalletIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
    />
  </svg>
);

const PlusIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4v16m8-8H4"
    />
  </svg>
);

const XIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const CheckIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

function formatDollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function TopupPaymentForm({
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
      confirmParams: {
        return_url: `${window.location.origin}/home`,
      },
      redirect: "if_required",
    });
    if (stripeError) {
      setPending(false);
      setError(stripeError.message ?? "Payment failed. Please try again.");
      return;
    }

    // Payment succeeded — credit the wallet synchronously (idempotent on the backend).
    const result = await confirmTopup(paymentIntentId);
    setPending(false);
    if (result.error) {
      setError(
        `Payment succeeded but crediting the wallet failed: ${result.error}`,
      );
      return;
    }
    router.refresh();
    onSuccess();
  }

  return (
    <form onSubmit={handleConfirm} className="space-y-4">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending || !stripe || !elements}
          className="flex-1 rounded-lg bg-[#1F5F2E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#174622] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? (
            <span className="flex items-center justify-center gap-1.5">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Processing…
            </span>
          ) : (
            `Confirm ${formatDollars(Math.round(amountDollars * 100))}`
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function WalletCard({
  balanceCents,
  transactions,
  patientId,
  viewerId,
}: Props) {
  const [showTopup, setShowTopup] = useState(false);
  const [amountDollars, setAmountDollars] = useState("");
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [topupSuccess, setTopupSuccess] = useState(false);

  function resetTopup() {
    setShowTopup(false);
    setAmountDollars("");
    setLoadingIntent(false);
    setIntentError(null);
    setClientSecret(null);
    setPaymentIntentId(null);
  }

  async function handleCreateIntent(e: React.FormEvent) {
    e.preventDefault();
    setIntentError(null);
    const dollars = parseFloat(amountDollars);
    if (!dollars || dollars < 1) {
      setIntentError("Minimum amount is $1.00.");
      return;
    }
    const amountCents = Math.round(dollars * 100);
    setLoadingIntent(true);
    const result = await createTopupIntent(patientId, amountCents);
    setLoadingIntent(false);
    if (result.error) {
      setIntentError(result.error);
      return;
    }
    if ("clientSecret" in result) {
      setClientSecret(result.clientSecret);
      setPaymentIntentId(result.paymentIntentId);
    }
  }

  function handlePaymentSuccess() {
    setTopupSuccess(true);
    resetTopup();
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[#1F5F2E]/10 p-2.5 text-[#1F5F2E]">
            <WalletIcon />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Wallet</h2>
            <p className="mt-0.5 text-sm text-slate-600">Available balance</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-[#1F5F2E]">
            {formatDollars(balanceCents)}
          </p>
        </div>
      </div>

      {/* Success banner */}
      {topupSuccess && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckIcon />
          <span>Funds added! Your wallet balance will update shortly.</span>
          <button
            type="button"
            onClick={() => setTopupSuccess(false)}
            className="ml-auto text-green-600 hover:text-green-800"
          >
            <XIcon />
          </button>
        </div>
      )}

      {/* Top-up section */}
      <div className="mt-5">
        {!showTopup ? (
          <button
            type="button"
            onClick={() => setShowTopup(true)}
            className="flex items-center gap-2 rounded-lg border border-[#1F5F2E]/30 bg-[#1F5F2E]/5 px-4 py-2 text-sm font-medium text-[#1F5F2E] transition hover:bg-[#1F5F2E]/10"
          >
            <PlusIcon />
            Add funds
          </button>
        ) : clientSecret && paymentIntentId ? (
          /* Step 2: Stripe Elements payment form */
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">
                Add {formatDollars(Math.round(parseFloat(amountDollars) * 100))}
              </p>
              <button
                type="button"
                onClick={resetTopup}
                className="text-slate-400 hover:text-slate-600"
              >
                <XIcon />
              </button>
            </div>
            <Elements
              stripe={getStripe()}
              options={{
                clientSecret,
                appearance: { theme: "stripe" },
              }}
            >
              <TopupPaymentForm
                amountDollars={parseFloat(amountDollars)}
                paymentIntentId={paymentIntentId}
                onSuccess={handlePaymentSuccess}
                onCancel={resetTopup}
              />
            </Elements>
          </div>
        ) : (
          /* Step 1: Amount input */
          <form
            onSubmit={handleCreateIntent}
            className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Add funds</p>
              <button
                type="button"
                onClick={resetTopup}
                className="text-slate-400 hover:text-slate-600"
              >
                <XIcon />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500 text-sm font-medium">
                  $
                </span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={amountDollars}
                  onChange={(e) => setAmountDollars(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-7 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1F5F2E] focus:outline-none focus:ring-2 focus:ring-[#1F5F2E]/20"
                />
              </div>
              <button
                type="submit"
                disabled={loadingIntent || !amountDollars}
                className="rounded-lg bg-[#1F5F2E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#174622] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loadingIntent ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Loading
                  </span>
                ) : (
                  "Next"
                )}
              </button>
            </div>
            {intentError && (
              <p className="mt-2 text-sm text-red-600">{intentError}</p>
            )}
          </form>
        )}
      </div>

      {/* Recent transactions */}
      {transactions.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Recent transactions
          </p>
          <ul className="space-y-2">
            {transactions.slice(0, 5).map((tx) => (
              <li
                key={tx.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate text-slate-700">
                    {topupLabel(tx, viewerId)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(tx.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={`ml-4 shrink-0 font-semibold ${
                    tx.amount_cents >= 0 ? "text-[#1F5F2E]" : "text-red-600"
                  }`}
                >
                  {tx.amount_cents >= 0 ? "+" : ""}
                  {formatDollars(tx.amount_cents)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {transactions.length === 0 && (
        <p className="mt-4 text-sm text-slate-400">No transactions yet.</p>
      )}
    </div>
  );
}
