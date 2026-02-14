"use client";

import { useState } from "react";
import { purchasePlanForPatient } from "./actions";

type CarePlan = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  features: string[] | null;
};

type Props = {
  carePlans: CarePlan[];
};

export function PurchasePlanForm({ carePlans }: Props) {
  const [email, setEmail] = useState("");
  const [planId, setPlanId] = useState(carePlans[0]?.id ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const result = await purchasePlanForPatient(email.trim(), planId);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    setEmail("");
  }

  if (success) {
    return (
      <p className="rounded-lg bg-[#E6E15A]/20 p-4 text-sm text-[#1F5F2E]">
        Request sent. The patient will receive a consent request (in-app or when they sign up). You’ll be notified when they respond.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-slate-600">
        Purchase a care plan for a patient. They’ll receive a consent request to accept or decline. Accepting allows you to see their health information and appointment schedules.
      </p>
      <div>
        <label htmlFor="patient_email" className="block text-sm font-medium text-slate-700">
          Patient email
        </label>
        <input
          id="patient_email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="patient@example.com"
          className="mt-1 w-full max-w-sm rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1F5F2E] focus:outline-none focus:ring-1 focus:ring-[#1F5F2E]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Plan</label>
        <div className="space-y-2">
          {carePlans.map((plan) => (
            <label key={plan.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 hover:bg-slate-50/50">
              <input
                type="radio"
                name="plan"
                value={plan.id}
                checked={planId === plan.id}
                onChange={() => setPlanId(plan.id)}
                className="mt-1 h-4 w-4 border-slate-300 text-[#1F5F2E] focus:ring-[#1F5F2E]"
              />
              <div>
                <span className="font-medium text-slate-900">{plan.name}</span>
                <span className="ml-2 text-sm text-slate-500">${(plan.price_cents / 100).toFixed(0)}/month</span>
                {plan.features && plan.features.length > 0 && (
                  <p className="mt-1 text-xs text-slate-600">{plan.features[0]}</p>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>
      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[#1F5F2E] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#174622] disabled:opacity-70"
      >
        {pending ? "Sending…" : "Purchase plan (simulated)"}
      </button>
    </form>
  );
}
