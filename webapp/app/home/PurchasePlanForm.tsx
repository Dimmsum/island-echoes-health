"use client";

import { useState } from "react";
import { invitePatient } from "./actions";

const MailIcon = ({ className }: { className?: string }) => (
  <svg
    className={className || "h-5 w-5"}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    className={className || "h-5 w-5"}
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

export function SupportPatientForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const result = await invitePatient(email.trim());
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSentTo(email.trim());
    setEmail("");
  }

  if (sentTo) {
    return (
      <div className="rounded-xl border border-[#1F5F2E]/20 bg-[#E6E15A]/20 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-[#1F5F2E]/10 p-1.5 text-[#1F5F2E]">
            <CheckIcon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1F5F2E]">Invite sent!</p>
            <p className="mt-1 text-sm text-slate-700">
              <span className="font-medium">{sentTo}</span> will receive a
              request to accept your support. Once they accept, you&apos;ll be
              able to view their care details.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSentTo(null)}
          className="mt-4 text-sm font-medium text-[#1F5F2E] hover:underline"
        >
          Send another invite
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-slate-600">
        Send them a support invite. They&apos;ll receive a request to accept,
        which allows you to see their health information and appointment
        schedules.
      </p>

      <div>
        <label
          htmlFor="patient_email"
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          Patient email address
        </label>
        <div className="relative max-w-md">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            <MailIcon className="h-4 w-4" />
          </span>
          <input
            id="patient_email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="patient@example.com"
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1F5F2E] focus:outline-none focus:ring-2 focus:ring-[#1F5F2E]/20"
          />
        </div>
      </div>

      {error && (
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={pending || !email.trim()}
        className="rounded-xl bg-[#1F5F2E] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#174622] hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {pending ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Sending…
          </span>
        ) : (
          "Send support invite"
        )}
      </button>
    </form>
  );
}
