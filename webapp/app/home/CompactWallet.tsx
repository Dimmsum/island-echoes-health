"use client";

import { useState } from "react";
import { createTopupCheckoutSession } from "./actions";
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
  return txLabel(tx, null).slice(0, 2).toUpperCase();
}

export function CompactWallet({ walletId: _walletId, balanceCents, transactions, patientId, viewerId }: Props) {
  const [showAmountInput, setShowAmountInput] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sansStyle = { fontFamily: "var(--font-hanken, 'Hanken Grotesk', sans-serif)" };
  const monoStyle = { fontFamily: "var(--font-ibm-mono, 'IBM Plex Mono', monospace)" };

  function openAmountInput() {
    setShowAmountInput(true);
    setAmount("");
    setError(null);
  }

  function cancelAmountInput() {
    setShowAmountInput(false);
    setAmount("");
    setError(null);
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const dollars = parseFloat(amount);
    if (!dollars || dollars < 1) { setError("Minimum $1.00"); return; }
    setLoading(true);
    const result = await createTopupCheckoutSession(patientId, Math.round(dollars * 100));
    setLoading(false);
    if ("error" in result && result.error) { setError(result.error); return; }
    if ("url" in result) {
      window.open(result.url, "_blank", "noopener,noreferrer");
      cancelAmountInput();
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border border-[#E9EEE9] bg-white p-5" style={sansStyle}>
      <div style={monoStyle} className="text-[11px] uppercase tracking-[.12em] text-[#8a988f]">
        Wallet
      </div>

      <div className="mt-3.5 text-[13px] text-[#6a7a70]">Current balance</div>
      <div className="mt-0.5 text-[32px] font-extrabold leading-none tracking-[-0.025em] text-[#16241D]">
        {fmt(balanceCents)}
      </div>

      <div className="mt-4 flex gap-2.5">
        <button
          type="button"
          onClick={openAmountInput}
          className="flex-1 rounded-[10px] bg-[#1F8A5B] py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#196e49]"
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

      {/* Inline amount input */}
      {showAmountInput && (
        <form onSubmit={handleCheckout} className="mt-4 space-y-2.5">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-[#16241D]">Amount to add</label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[14px] font-medium text-[#6a7a70]">$</span>
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
                className="w-full rounded-[10px] border border-[#E6EBE6] py-2 pl-7 pr-4 text-[14px] text-[#16241D] placeholder:text-[#9aa89f] focus:border-[#1F8A5B] focus:outline-none focus:ring-2 focus:ring-[#1F8A5B]/20"
              />
            </div>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !amount}
              className="flex-1 rounded-[10px] bg-[#1F8A5B] py-2 text-[13px] font-semibold text-white transition hover:bg-[#196e49] disabled:opacity-70"
            >
              {loading ? "Opening…" : "Continue →"}
            </button>
            <button
              type="button"
              onClick={cancelAmountInput}
              className="rounded-[10px] border border-[#DCE4DD] px-3.5 py-2 text-[13px] font-medium text-[#16241D]"
            >
              Cancel
            </button>
          </div>
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
              <div className={`shrink-0 text-[13px] font-bold ${tx.amount_cents >= 0 ? "text-[#1F8A5B]" : "text-[#16241D]"}`}>
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
