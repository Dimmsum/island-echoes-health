"use client";

import { useState } from "react";
import { acceptConsentRequest, declineConsentRequest } from "./actions";

type ConsentItem = {
  id: string;
  patient_email: string;
  care_plan: { id: string; name: string } | null;
  sponsor_name: string;
};

type Props = {
  requests: ConsentItem[];
};

export function ConsentRequestCards({ requests }: Props) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept(id: string) {
    setPendingId(id);
    setError(null);
    const result = await acceptConsentRequest(id);
    setPendingId(null);
    if (result.error) setError(result.error);
  }

  async function handleDecline(id: string) {
    setPendingId(id);
    setError(null);
    const result = await declineConsentRequest(id);
    setPendingId(null);
    if (result.error) setError(result.error);
  }

  if (requests.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Consent requests</h2>
      <p className="text-sm text-slate-600">
        Accepting allows the sponsor to see your health information and appointment schedules.
      </p>
      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}
      <div className="space-y-3">
        {requests.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="font-medium text-slate-900">{r.sponsor_name}</p>
            <p className="text-sm text-slate-600">
              wants to sponsor you on <strong>{r.care_plan?.name ?? "a plan"}</strong>.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => handleAccept(r.id)}
                disabled={pendingId !== null}
                className="rounded-full bg-[#1F5F2E] px-4 py-2 text-sm font-medium text-white hover:bg-[#174622] disabled:opacity-70"
              >
                {pendingId === r.id ? "Accepting…" : "Accept"}
              </button>
              <button
                type="button"
                onClick={() => handleDecline(r.id)}
                disabled={pendingId !== null}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-70"
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
