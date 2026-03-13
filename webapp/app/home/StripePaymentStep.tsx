"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

type Props = {
  clientSecret: string;
  publishableKey: string;
  onCancel: () => void;
};

function PayButton({ clientSecret, onCancel }: { clientSecret: string; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    if (!stripe || !elements) return;
    setError(null);
    setPending(true);
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "Please complete the form.");
      setPending(false);
      return;
    }
    const returnUrl = `${window.location.origin}/home`;
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: { return_url: returnUrl },
    });
    setPending(false);
    if (confirmError) {
      setError(confirmError.message ?? "Payment failed.");
      return;
    }
  }

  return (
    <div className="space-y-4">
      <PaymentElement
        options={{ layout: "tabs" }}
        onChange={(e) => setError(e.error?.message ?? null)}
      />
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handlePay}
          disabled={pending || !stripe}
          className="rounded-xl bg-[#1F5F2E] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#174622] disabled:opacity-70"
        >
          {pending ? "Processing…" : "Pay now"}
        </button>
      </div>
    </div>
  );
}

export function StripePaymentStep({ clientSecret, publishableKey, onCancel }: Props) {
  const stripePromise = loadStripe(publishableKey);

  return (
    <div className="rounded-xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Payment</h2>
      <p className="mt-1 text-sm text-slate-600">
        Enter your card details below. Payment is secure and powered by Stripe.
      </p>
      <div className="mt-6">
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: "stripe",
              variables: { colorPrimary: "#1F5F2E" },
            },
          }}
        >
          <PayButton clientSecret={clientSecret} onCancel={onCancel} />
        </Elements>
      </div>
    </div>
  );
}
