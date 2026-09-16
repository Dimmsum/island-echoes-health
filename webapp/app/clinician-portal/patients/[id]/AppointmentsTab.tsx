"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { rescheduleAppointment, updateAppointmentStatus } from "../../../home/clinician-actions";
import type { PatientAppointment } from "./patient-chart-types";

type Props = {
  appointments: PatientAppointment[];
};

function statusBadge(status: string) {
  switch (status) {
    case "completed":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20";
    case "cancelled":
      return "bg-red-50 text-red-700 ring-1 ring-red-600/20";
    case "scheduled":
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20";
    case "no_show":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AppointmentsTab({ appointments }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  const sorted = [...appointments].sort(
    (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
  );

  async function handleCancel(id: string) {
    setPending(id);
    await updateAppointmentStatus(id, "cancelled");
    setPending(null);
    router.refresh();
  }

  async function handleReschedule(id: string, currentIso: string) {
    const input = window.prompt("New date/time (e.g. 2026-10-14 10:30)", currentIso.slice(0, 16).replace("T", " "));
    if (!input) return;
    const parsed = new Date(input.replace(" ", "T"));
    if (Number.isNaN(parsed.getTime())) return;
    setPending(id);
    await rescheduleAppointment(id, parsed.toISOString());
    setPending(null);
    router.refresh();
  }

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-[rgba(18,61,43,.08)] bg-white p-6 text-sm text-[#8C9A91]">
        No appointments recorded for this patient yet.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[rgba(18,61,43,.08)] bg-white p-6">
      <div className="flex flex-col divide-y divide-[rgba(18,61,43,.08)]">
        {sorted.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#14251c]">{formatDateTime(a.scheduledAt)}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${statusBadge(a.status)}`}>
                  {a.status.replace(/_/g, " ")}
                </span>
              </div>
              <div className="mt-1 text-xs text-[#8C9A91]">
                {a.appointmentType ? a.appointmentType.replace(/_/g, " ") : "Appointment"}
              </div>
            </div>
            <div className="flex gap-2">
              {a.status === "scheduled" && (
                <>
                  <button
                    type="button"
                    onClick={() => handleReschedule(a.id, a.scheduledAt)}
                    disabled={pending !== null}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Reschedule
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCancel(a.id)}
                    disabled={pending !== null}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    {pending === a.id ? "Saving…" : "Cancel"}
                  </button>
                </>
              )}
              <Link
                href={`/clinician-portal/appointments/${a.id}`}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Open
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
