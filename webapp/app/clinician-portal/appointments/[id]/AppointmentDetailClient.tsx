"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateAppointmentStatus } from "../../../home/clinician-actions";
import { AppointmentDetailClient as SharedDetailClient } from "../../../home/appointments/[id]/AppointmentDetailClient";

type Note = { id: string; content: string; created_at: string };
type Service = { id: string; service_type: string; details: string | null; created_at: string };

type Props = {
  appointmentId: string;
  patientId: string;
  patientName: string | null;
  clinicianName: string | null;
  scheduledAt: string;
  status: string;
  notes: Note[];
  services: Service[];
};

const CalendarIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const UserIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

function getStatusLabel(status: string) {
  switch (status) {
    case "completed": return "Completed";
    case "cancelled": return "Canceled";
    case "scheduled": return "Scheduled";
    case "no_show": return "No show";
    default: return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case "completed": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "cancelled": return "bg-red-500/20 text-red-400 border-red-500/30";
    case "scheduled": return "bg-[#1F5F2E]/30 text-[#9CCB4A] border-[#1F5F2E]/40";
    case "no_show": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

export function ClinicianAppointmentDetailClient({
  appointmentId,
  patientId,
  patientName,
  clinicianName,
  scheduledAt,
  status,
  notes,
  services,
}: Props) {
  const router = useRouter();
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const date = new Date(scheduledAt);

  async function handleStatus(newStatus: "completed" | "no_show" | "cancelled") {
    setPendingStatus(newStatus);
    await updateAppointmentStatus(appointmentId, newStatus);
    setPendingStatus(null);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {/* Summary card */}
      <div className="rounded-2xl border border-white/10 bg-[#1a1f26] p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                {patientName ?? "Patient"}
              </h1>
              <span className={`rounded-full border px-3 py-1 text-sm font-medium ${getStatusClass(status)}`}>
                {getStatusLabel(status)}
              </span>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <UserIcon />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Clinician</dt>
                  <dd className="text-sm font-medium text-white">{clinicianName ?? "—"}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <CalendarIcon />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Date & time</dt>
                  <dd className="text-sm font-medium text-white">
                    {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                  </dd>
                  <dd className="text-sm text-slate-400">
                    {date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </dd>
                </div>
              </div>
            </dl>
          </div>
          {status === "scheduled" && (
            <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
              <button
                type="button"
                onClick={() => handleStatus("completed")}
                disabled={pendingStatus !== null}
                className="rounded-xl bg-emerald-500/20 px-4 py-2.5 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/30 disabled:opacity-50"
              >
                {pendingStatus === "completed" ? "Updating…" : "Mark complete"}
              </button>
              <button
                type="button"
                onClick={() => handleStatus("no_show")}
                disabled={pendingStatus !== null}
                className="rounded-xl bg-amber-500/20 px-4 py-2.5 text-sm font-semibold text-amber-400 transition hover:bg-amber-500/30 disabled:opacity-50"
              >
                No show
              </button>
              <button
                type="button"
                onClick={() => handleStatus("cancelled")}
                disabled={pendingStatus !== null}
                className="rounded-xl bg-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/30 disabled:opacity-50"
              >
                Cancel appointment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notes, services, metrics */}
      <div>
        <h2 className="mb-6 text-lg font-semibold text-white">Visit details</h2>
        <SharedDetailClient
          appointmentId={appointmentId}
          patientId={patientId}
          notes={notes}
          services={services}
          variant="dark"
        />
      </div>
    </div>
  );
}
