"use client";

import { useState } from "react";
import { getStripeCustomerPortalUrl } from "./actions";

export function BillingPortalButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setPending(true);
    setError(null);
    const result = await getStripeCustomerPortalUrl();
    setPending(false);
    if (result.error || !result.url) {
      setError(
        result.error || "Unable to open billing portal. Please try again.",
      );
      return;
    }
    window.location.href = result.url;
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={openPortal}
        disabled={pending}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
      >
        {pending
          ? "Opening Stripe billing portal..."
          : "Manage billing in Stripe"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
