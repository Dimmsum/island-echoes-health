"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { rescheduleAppointment, updateAppointmentStatus } from "../../../home/clinician-actions";
import { mono } from "../../ClinicianPortalSidebar";
import { QuickBookWidget } from "./QuickBookWidget";
import type { PatientAppointment } from "./patient-chart-types";

type Props = {
  patientId: string;
  appointments: PatientAppointment[];
  nextAppointment: PatientAppointment | null;
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

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-[100px]">
      <div className="text-[9px] font-semibold uppercase tracking-[.1em] text-[#9aa8a0]" style={mono}>
        {label}
      </div>
      <div className="mt-1.5 text-[13.5px] font-semibold text-[#14251c]">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-[#8C9A91]">{sub}</div>}
    </div>
  );
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function AppointmentsTab({ patientId, appointments, nextAppointment }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  const now = new Date();
  const upcoming = [...appointments]
    .filter((a) => a.status === "scheduled" && new Date(a.scheduledAt) >= now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const past = [...appointments]
    .filter((a) => new Date(a.scheduledAt) < now || (a.status !== "scheduled"))
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  const completed = appointments.filter((a) => a.status === "completed").length;
  const noShows = appointments.filter((a) => a.status === "no_show").length;

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

  function renderRow(a: PatientAppointment) {
    return (
      <div
        key={a.id}
        className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-[rgba(18,61,43,.06)] last:border-b-0"
      >
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
                className="rounded-lg border border-[rgba(18,61,43,.14)] px-3 py-1.5 text-xs font-semibold text-[#3d4a43] transition hover:bg-[#f4f6f4] disabled:opacity-50"
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
            className="rounded-lg border border-[rgba(18,61,43,.14)] px-3 py-1.5 text-xs font-semibold text-[#3d4a43] transition hover:bg-[#f4f6f4]"
          >
            Open
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-[14px] border border-[rgba(18,61,43,.08)] bg-white p-5">
        <StatTile
          label="Next"
          value={nextAppointment ? formatShortDate(nextAppointment.scheduledAt) : "Not booked"}
          sub={nextAppointment?.appointmentType?.replace(/_/g, " ")}
        />
        <div className="h-8 w-px self-stretch bg-[rgba(18,61,43,.1)]" />
        <StatTile label="Total visits" value={String(appointments.length)} />
        <div className="h-8 w-px self-stretch bg-[rgba(18,61,43,.1)]" />
        <StatTile label="Completed" value={String(completed)} />
        <div className="h-8 w-px self-stretch bg-[rgba(18,61,43,.1)]" />
        <StatTile label="No-shows" value={String(noShows)} />
      </div>

      <QuickBookWidget patientId={patientId} nextAppointment={nextAppointment} />

      <div className="rounded-[14px] border border-[rgba(18,61,43,.08)] bg-white overflow-hidden">
        <div className="border-b border-[rgba(18,61,43,.08)] px-5 py-4 text-[10px] font-semibold uppercase tracking-[.14em] text-[#8C9A91]" style={mono}>
          Upcoming
        </div>
        {upcoming.length === 0 ? (
          <p className="px-5 py-6 text-sm text-[#8C9A91]">No upcoming appointments booked.</p>
        ) : (
          <div className="flex flex-col">{upcoming.map(renderRow)}</div>
        )}
      </div>

      <div className="rounded-[14px] border border-[rgba(18,61,43,.08)] bg-white overflow-hidden">
        <div className="border-b border-[rgba(18,61,43,.08)] px-5 py-4 text-[10px] font-semibold uppercase tracking-[.14em] text-[#8C9A91]" style={mono}>
          Past · {past.length}
        </div>
        {past.length === 0 ? (
          <p className="px-5 py-6 text-sm text-[#8C9A91]">No past appointments recorded.</p>
        ) : (
          <div className="flex flex-col">{past.map(renderRow)}</div>
        )}
      </div>
    </div>
  );
}
