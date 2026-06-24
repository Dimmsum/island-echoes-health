"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CustomInput } from "../../../components/CustomInput";
import { CustomTextArea } from "../../../components/CustomTextArea";
import { createFollowUp, updateFollowUp } from "../../follow-up-actions";
import type { FollowUp } from "../../follow-up-types";

type Props = {
  appointmentId: string;
  patientId: string;
  followUps: FollowUp[];
};

function statusBadge(status: string, overdue: boolean) {
  if (overdue) return "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20";
  switch (status) {
    case "completed":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20";
    case "cancelled":
      return "bg-slate-100 text-slate-600 ring-1 ring-slate-400/20";
    default:
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20";
  }
}

function statusLabel(status: string, overdue: boolean) {
  if (overdue) return "Overdue";
  switch (status) {
    case "completed":
      return "Completed";
    case "cancelled":
      return "Canceled";
    default:
      return "Pending";
  }
}

function formatDate(iso: string) {
  // dueDate is a plain YYYY-MM-DD; parse as local to avoid TZ drift.
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function FollowUpsSection({ appointmentId, patientId, followUps }: Props) {
  const router = useRouter();
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!dueDate) {
      setError("A due date is required.");
      return;
    }
    setError(null);
    setPending("create");
    const result = await createFollowUp({
      patientId,
      dueDate,
      notes: notes.trim() || undefined,
      appointmentId,
    });
    setPending(null);
    if (result.error) setError(result.error);
    else {
      setDueDate("");
      setNotes("");
      router.refresh();
    }
  }

  async function handleComplete(id: string) {
    setError(null);
    setPending(id);
    const result = await updateFollowUp(id, { status: "completed" }, appointmentId);
    setPending(null);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Follow-ups</h2>

      {followUps.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {followUps.map((f) => (
            <li
              key={f.id}
              className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge(f.status, f.overdue)}`}
                  >
                    {statusLabel(f.status, f.overdue)}
                  </span>
                  <span className="text-sm text-slate-600">
                    Due {formatDate(f.dueDate)}
                  </span>
                </div>
                {f.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => handleComplete(f.id)}
                    disabled={pending !== null}
                    className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                  >
                    {pending === f.id ? "Saving…" : "Mark complete"}
                  </button>
                )}
              </div>
              {f.notes && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                  {f.notes}
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">
          No follow-ups for this appointment yet.
        </p>
      )}

      <form onSubmit={handleCreate} className="mt-6 space-y-4">
        <CustomInput
          label="Due date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <CustomTextArea
          label="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What needs to happen next…"
          rows={3}
        />
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={pending !== null}
          className="rounded-xl bg-[#1F5F2E] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#174a23] disabled:opacity-50"
        >
          {pending === "create" ? "Adding…" : "Add follow-up"}
        </button>
      </form>
    </section>
  );
}
