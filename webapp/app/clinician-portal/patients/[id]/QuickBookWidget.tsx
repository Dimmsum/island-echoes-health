"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createAppointment,
  rescheduleAppointment,
  updateAppointmentStatus,
} from "../../../home/clinician-actions";
import type { PatientAppointment } from "./patient-chart-types";

// Mirrors public.appointment_service_type (supabase/migrations/00008_appointments.sql),
// reused here as the appointment-type options — there's no separate scheduling-type taxonomy.
const APPOINTMENT_TYPES = [
  { value: "vitals", label: "Vitals check" },
  { value: "chronic_lab", label: "Chronic lab" },
  { value: "wellness_check", label: "Wellness check" },
  { value: "follow_up", label: "Follow-up" },
  { value: "coordination", label: "Coordination" },
] as const;

type Props = {
  patientId: string;
  nextAppointment: PatientAppointment | null;
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Convenience chips only prefill the datetime input — there's no availability/scheduling
// engine behind this, so these are not real derived-from-availability slots.
function convenienceSlots(): { label: string; iso: string }[] {
  const now = new Date();
  const tomorrow9am = new Date(now);
  tomorrow9am.setDate(now.getDate() + 1);
  tomorrow9am.setHours(9, 0, 0, 0);

  const tomorrow1pm = new Date(tomorrow9am);
  tomorrow1pm.setHours(13, 0, 0, 0);

  const nextMonday = new Date(now);
  const daysUntilMonday = (8 - nextMonday.getDay()) % 7 || 7;
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(9, 0, 0, 0);

  return [
    { label: "Tomorrow 9am", iso: tomorrow9am.toISOString() },
    { label: "Tomorrow 1pm", iso: tomorrow1pm.toISOString() },
    { label: "Next Monday 9am", iso: nextMonday.toISOString() },
  ];
}

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function QuickBookWidget({ patientId, nextAppointment }: Props) {
  const router = useRouter();
  const [appointmentType, setAppointmentType] = useState<(typeof APPOINTMENT_TYPES)[number]["value"]>("follow_up");
  const [scheduledAt, setScheduledAt] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!scheduledAt) {
      setError("Pick a date and time.");
      return;
    }
    setError(null);
    setPending("book");
    const result = await createAppointment(patientId, new Date(scheduledAt).toISOString(), appointmentType);
    setPending(null);
    if (result.error) setError(result.error);
    else {
      setScheduledAt("");
      router.refresh();
    }
  }

  async function handleReschedule() {
    if (!nextAppointment) return;
    const input = window.prompt(
      "New date/time (e.g. 2026-10-14 10:30)",
      toLocalInputValue(nextAppointment.scheduledAt).replace("T", " "),
    );
    if (!input) return;
    const parsed = new Date(input.replace(" ", "T"));
    if (Number.isNaN(parsed.getTime())) {
      setError("Couldn't parse that date/time.");
      return;
    }
    setPending("reschedule");
    const result = await rescheduleAppointment(nextAppointment.id, parsed.toISOString());
    setPending(null);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  async function handleCancel() {
    if (!nextAppointment) return;
    setPending("cancel");
    const result = await updateAppointmentStatus(nextAppointment.id, "cancelled");
    setPending(null);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  return (
    <div className="rounded-2xl border border-[rgba(18,61,43,.08)] bg-white p-6">
      <div className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#8C9A91]">
        Next appointment
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {nextAppointment ? (
          <div className="rounded-xl bg-[#0f3d2b] p-4">
            <div className="text-[9px] font-semibold uppercase tracking-[.1em] text-[#8fb5a0]">
              Booked
            </div>
            <div className="mt-1.5 text-sm font-semibold text-white">
              {formatDateTime(nextAppointment.scheduledAt)}
            </div>
            <div className="mt-1 text-xs text-[#a9c6b7]">
              {nextAppointment.appointmentType ?? "Appointment"}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={handleReschedule}
                disabled={pending !== null}
                className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/25 disabled:opacity-50"
              >
                {pending === "reschedule" ? "Saving…" : "Reschedule"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={pending !== null}
                className="rounded-lg border border-white/30 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                {pending === "cancel" ? "Saving…" : "Cancel"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center rounded-xl border border-dashed border-[rgba(18,61,43,.16)] p-4 text-sm text-[#8C9A91]">
            No upcoming appointment scheduled.
          </div>
        )}

        <form onSubmit={handleBook} className="rounded-xl border border-[rgba(18,61,43,.12)] bg-[#fbfcfb] p-4">
          <div className="text-[9px] font-semibold uppercase tracking-[.1em] text-[#9aa8a0]">
            Book another
          </div>
          <div className="mt-2.5 flex flex-col gap-2">
            <div className="flex gap-2">
              <select
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value as typeof appointmentType)}
                className="flex-1 rounded-lg border border-[rgba(18,61,43,.14)] bg-white px-2.5 py-2 text-xs text-[#3d4a43]"
              >
                {APPOINTMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="flex-1 rounded-lg border border-[rgba(18,61,43,.14)] bg-white px-2.5 py-2 text-xs text-[#3d4a43]"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {convenienceSlots().map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setScheduledAt(toLocalInputValue(s.iso))}
                  className="rounded-lg bg-[#f4f6f4] px-2.5 py-1.5 text-[10.5px] font-medium text-[#5a6a61] hover:bg-[#e7f0e9]"
                >
                  {s.label}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={pending !== null}
              className="mt-1 rounded-lg bg-[#0f5132] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#0c3f28] disabled:opacity-50"
            >
              {pending === "book" ? "Booking…" : "Book"}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
