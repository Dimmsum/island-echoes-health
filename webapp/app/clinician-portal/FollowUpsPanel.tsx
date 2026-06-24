"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateFollowUp } from "./follow-up-actions";
import type { FollowUp } from "./follow-up-types";

type Props = {
  followUps: FollowUp[];
  patientNames: Record<string, string>;
};

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function FollowUpsPanel({ followUps, patientNames }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleComplete(f: FollowUp) {
    setError(null);
    setPending(f.id);
    const result = await updateFollowUp(
      f.id,
      { status: "completed" },
      f.appointmentId ?? undefined,
    );
    setPending(null);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  return (
    <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Follow-ups</h2>
        <span className="text-sm text-slate-500">
          {followUps.length} open
        </span>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {followUps.length === 0 ? (
        <p className="text-sm text-slate-500">No open follow-ups.</p>
      ) : (
        <ul className="space-y-3">
          {followUps.map((f) => (
            <li
              key={f.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-slate-900">
                    {patientNames[f.patientId] ?? "Patient"}
                  </span>
                  {f.overdue && (
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20">
                      Overdue
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Due {formatDate(f.dueDate)}
                  {f.notes ? ` · ${f.notes}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {f.appointmentId && (
                  <Link
                    href={`/clinician-portal/appointments/${f.appointmentId}`}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    View
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => handleComplete(f)}
                  disabled={pending !== null}
                  className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                >
                  {pending === f.id ? "Saving…" : "Mark complete"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
