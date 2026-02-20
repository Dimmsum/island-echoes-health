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

const CheckIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const UserIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const MailIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

export function PurchasePlanForm({ carePlans }: Props) {
  const [email, setEmail] = useState("");
  const [planId, setPlanId] = useState(carePlans[0]?.id ?? "");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedPlan = carePlans.find((p) => p.id === planId);

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !planId) {
      setError("Please enter a patient email and select a plan.");
      return;
    }
    setError(null);
    setShowConfirmation(true);
  }

  function handleBack() {
    setShowConfirmation(false);
    setError(null);
  }

  async function handleConfirm() {
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
    setShowConfirmation(false);
  }

  if (success) {
    return (
      <div className="rounded-xl border border-[#1F5F2E]/20 bg-[#E6E15A]/20 p-5">
        <p className="text-sm font-medium text-[#1F5F2E]">
          Request sent. The patient will receive a consent request (in-app or when they sign up). You'll be notified when they respond.
        </p>
      </div>
    );
  }

  if (showConfirmation && selectedPlan) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-[#1F5F2E]/10 p-2.5 text-[#1F5F2E]">
              <CheckIcon />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Confirm purchase</h2>
              <p className="mt-0.5 text-sm text-slate-600">
                Review the details before proceeding
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Patient Details */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-5">
              <div className="mb-3 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-[#1F5F2E]" />
                <h3 className="font-semibold text-slate-900">Patient details</h3>
              </div>
              <div className="mt-3 flex items-center gap-3 rounded-lg bg-white p-3">
                <MailIcon className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Email address
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-slate-900">{email}</p>
                </div>
              </div>
            </div>

            {/* Plan Details */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="rounded-lg bg-[#1F5F2E]/10 p-1.5">
                  <CheckIcon className="h-4 w-4 text-[#1F5F2E]" />
                </div>
                <h3 className="font-semibold text-slate-900">Selected plan</h3>
              </div>
              <div className="mt-3 rounded-lg border-2 border-[#1F5F2E]/20 bg-white p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-slate-900">{selectedPlan.name}</h4>
                    <p className="mt-1 text-2xl font-bold text-[#1F5F2E]">
                      ${(selectedPlan.price_cents / 100).toFixed(0)}
                      <span className="ml-1 text-sm font-normal text-slate-600">/month</span>
                    </p>
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1F5F2E] text-white">
                    <CheckIcon />
                  </div>
                </div>
                {selectedPlan.features && selectedPlan.features.length > 0 && (
                  <ul className="mt-4 space-y-2 border-t border-slate-200 pt-4">
                    {selectedPlan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckIcon className="h-4 w-4 shrink-0 text-[#1F5F2E] mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Important Note */}
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
              <p className="text-sm text-slate-700">
                <span className="font-semibold">Note:</span> The patient will receive a consent request to accept or decline this plan. Accepting allows you to see their health information and appointment schedules.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleBack}
            disabled={pending}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <ArrowLeftIcon />
            Back to edit
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#1F5F2E] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#174622] hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {pending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Processing…
              </>
            ) : (
              <>
                <CheckIcon />
                Confirm purchase
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleContinue} className="space-y-6">
      <p className="text-sm text-slate-600">
        Purchase a care plan for a patient. They'll receive a consent request to accept or decline. Accepting allows you to see their health information and appointment schedules.
      </p>
      
      <div>
        <label htmlFor="patient_email" className="block text-sm font-medium text-slate-700 mb-2">
          Patient email
        </label>
        <input
          id="patient_email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="patient@example.com"
          className="w-full max-w-md rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1F5F2E] focus:outline-none focus:ring-2 focus:ring-[#1F5F2E]/20"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-4">Select a plan</label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {carePlans.map((plan) => (
            <label
              key={plan.id}
              className={`group relative flex cursor-pointer flex-col rounded-xl border-2 p-5 transition-all ${
                planId === plan.id
                  ? "border-[#1F5F2E] bg-[#1F5F2E]/5 shadow-md"
                  : "border-slate-200 bg-white hover:border-[#1F5F2E]/30 hover:shadow-md"
              }`}
            >
              <input
                type="radio"
                name="plan"
                value={plan.id}
                checked={planId === plan.id}
                onChange={() => setPlanId(plan.id)}
                className="sr-only"
              />
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                  <p className="mt-1 text-2xl font-bold text-[#1F5F2E]">
                    ${(plan.price_cents / 100).toFixed(0)}
                    <span className="ml-1 text-sm font-normal text-slate-600">/month</span>
                  </p>
                </div>
                {planId === plan.id && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1F5F2E] text-white">
                    <CheckIcon />
                  </div>
                )}
                {planId !== plan.id && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 group-hover:border-[#1F5F2E]" />
                )}
              </div>
              {plan.features && plan.features.length > 0 && (
                <ul className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                  {plan.features.slice(0, 3).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckIcon className="h-4 w-4 shrink-0 text-[#1F5F2E] mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {plan.features.length > 3 && (
                    <li className="text-xs text-slate-500">+{plan.features.length - 3} more</li>
                  )}
                </ul>
              )}
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || !email.trim() || !planId}
          className="rounded-xl bg-[#1F5F2E] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#174622] hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
        >
          Continue to review
        </button>
        {email.trim() && planId && (
          <p className="text-xs text-slate-500">
            You'll review the details before confirming
          </p>
        )}
      </div>
    </form>
  );
}
