"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateAppointmentStatus } from "../../../home/clinician-actions";
import { AppointmentDetailClient as SharedDetailClient } from "../../../home/appointments/[id]/AppointmentDetailClient";

type Note = { id: string; content: string; created_at: string };
type Service = { id: string; service_type: string; details: string | null; created_at: string };

type PreviousMetric = {
  id: string;
  recorded_at: string;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  weight_kg: number | null;
  a1c: number | null;
  medication_adherence: string | null;
};

type Props = {
  appointmentId: string;
  patientId: string;
  patientName: string | null;
  patientAvatarUrl: string | null;
  clinicianName: string | null;
  clinicianAvatarUrl: string | null;
  scheduledAt: string;
  status: string;
  previousMetrics: PreviousMetric[];
  notes: Note[];
  services: Service[];
};

function getStatusLabel(status: string) {
  switch (status) {
    case "completed": return "Completed";
    case "cancelled": return "Canceled";
    case "scheduled": return "Scheduled";
    case "no_show": return "No show";
    default: return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "completed": return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20";
    case "cancelled": return "bg-red-50 text-red-700 ring-1 ring-red-600/20";
    case "scheduled": return "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20";
    case "no_show": return "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20";
    default: return "bg-slate-100 text-slate-600";
  }
}

function formatMetricRow(m: PreviousMetric) {
  const parts: string[] = [];
  if (m.blood_pressure_systolic != null && m.blood_pressure_diastolic != null) {
    parts.push(`BP ${m.blood_pressure_systolic}/${m.blood_pressure_diastolic}`);
  }
  if (m.weight_kg != null) parts.push(`${m.weight_kg} kg`);
  if (m.a1c != null) parts.push(`A1C ${m.a1c}`);
  if (m.medication_adherence) parts.push(m.medication_adherence);
  return parts.length ? parts.join(" · ") : "—";
}

const Avatar = ({
  src,
  alt,
  size = "md",
}: {
  src: string | null;
  alt: string;
  size?: "sm" | "md" | "lg";
}) => {
  const sizeClass = size === "lg" ? "h-16 w-16 sm:h-20 sm:w-20" : size === "sm" ? "h-10 w-10" : "h-12 w-12";
  return (
    <div
      className={`${sizeClass} shrink-0 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100`}
    >
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-slate-400">
          <svg className="h-1/2 w-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )}
    </div>
  );
};

export function ClinicianAppointmentDetailClient({
  appointmentId,
  patientId,
  patientName,
  patientAvatarUrl,
  clinicianName,
  clinicianAvatarUrl,
  scheduledAt,
  status,
  previousMetrics,
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
      {/* Redesigned top section */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
        {/* Primary row: date + status first, then patient & clinician */}
        <div className="flex flex-col gap-6 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1F5F2E]/10 text-[#1F5F2E]">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </p>
                <p className="text-sm text-slate-500">
                  {date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
            </div>
            <span className={`rounded-full px-3 py-1.5 text-sm font-medium ${getStatusBadge(status)}`}>
              {getStatusLabel(status)}
            </span>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:gap-12">
            {/* Patient block */}
            <div className="flex gap-4 rounded-xl bg-slate-50/80 p-4 ring-1 ring-slate-200/60">
              <Avatar src={patientAvatarUrl} alt={patientName ?? "Patient"} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Patient</p>
                <h1 className="mt-0.5 text-base font-bold text-slate-900">
                  {patientName ?? "Patient"}
                </h1>
                <div className="mt-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Previous metrics</p>
                  {previousMetrics.length === 0 ? (
                    <p className="mt-1 text-xs text-slate-500">None recorded</p>
                  ) : (
                    <ul className="mt-1.5 space-y-1">
                      {previousMetrics.slice(0, 4).map((m) => (
                        <li key={m.id} className="flex flex-wrap items-baseline gap-x-2 text-xs text-slate-600">
                          <span className="text-slate-400">
                            {new Date(m.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                          </span>
                          <span>{formatMetricRow(m)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Clinician block */}
            <div className="flex items-center gap-4 rounded-xl bg-slate-50/80 p-4 ring-1 ring-slate-200/60">
              <Avatar src={clinicianAvatarUrl} alt={clinicianName ?? "Clinician"} size="sm" />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Clinician</p>
                <p className="mt-0.5 text-base font-semibold text-slate-900">{clinicianName ?? "—"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status actions */}
        {status === "scheduled" && (
          <div className="flex flex-wrap gap-2 border-t border-slate-200 bg-slate-50/50 px-6 py-4 sm:px-8 sm:py-5">
            <button
              type="button"
              onClick={() => handleStatus("completed")}
              disabled={pendingStatus !== null}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {pendingStatus === "completed" ? "Updating…" : "Mark complete"}
            </button>
            <button
              type="button"
              onClick={() => handleStatus("no_show")}
              disabled={pendingStatus !== null}
              className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 shadow-sm transition hover:bg-amber-100 disabled:opacity-50"
            >
              No show
            </button>
            <button
              type="button"
              onClick={() => handleStatus("cancelled")}
              disabled={pendingStatus !== null}
              className="rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-100 disabled:opacity-50"
            >
              Cancel appointment
            </button>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-6 text-lg font-semibold text-slate-900">Visit details</h2>
        <SharedDetailClient
          appointmentId={appointmentId}
          patientId={patientId}
          notes={notes}
          services={services}
          variant="light"
        />
      </div>
    </div>
  );
}
