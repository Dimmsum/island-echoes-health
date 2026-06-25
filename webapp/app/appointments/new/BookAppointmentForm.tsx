"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bookAppointment } from "../actions";
import { AppointmentSelect } from "./AppointmentSelect";
import { CalendarPanel } from "./CalendarPanel";

type Clinician = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

const APPOINTMENT_TYPES = [
  { value: "wellness_check", label: "Wellness Check" },
  { value: "follow_up", label: "Follow-up" },
  { value: "chronic_care", label: "Chronic Care" },
  { value: "coordination", label: "Care Coordination" },
];

const monoStyle = { fontFamily: "var(--font-ibm-mono, 'IBM Plex Mono', monospace)" };

const textareaClass =
  "mt-1.5 w-full resize-none rounded-xl border border-[#E9EEE9] bg-white px-4 py-2.5 text-[14px] text-[#16241D] placeholder:text-[#c0c8c3] focus:border-[#1F8A5B] focus:outline-none focus:ring-1 focus:ring-[#1F8A5B]";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={monoStyle} className="block text-[11px] font-semibold uppercase tracking-[.08em] text-[#8a988f]">
      {children}
    </label>
  );
}

export function BookAppointmentForm({ clinicians }: { clinicians: Clinician[] }) {
  const router = useRouter();
  const [clinicianId, setClinicianId] = useState(clinicians[0]?.id ?? "");
  const [appointmentType, setAppointmentType] = useState(APPOINTMENT_TYPES[0].value);
  const [scheduledAt, setScheduledAt] = useState("");
  const [patientNotes, setPatientNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clinicianOptions = clinicians.map((c) => ({
    value: c.id,
    label: c.full_name ?? "Clinician",
  }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clinicianId || !scheduledAt) return;
    setSubmitting(true);
    setError(null);
    const result = await bookAppointment(clinicianId, scheduledAt, appointmentType, patientNotes);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/appointments");
  }

  if (clinicians.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-[#E9EEE9] bg-white p-[22px] text-center text-[14px] text-[#94a298]">
        No clinicians are available right now. Please check back later.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">

        {/* Left column — form fields */}
        <div className="rounded-2xl border border-[#E9EEE9] bg-white p-[22px]">
          <div className="space-y-5">
            <div>
              <FieldLabel>Clinician</FieldLabel>
              <AppointmentSelect
                value={clinicianId}
                onChange={setClinicianId}
                options={clinicianOptions}
                placeholder="Choose a clinician…"
              />
            </div>

            <div>
              <FieldLabel>Visit type</FieldLabel>
              <AppointmentSelect
                value={appointmentType}
                onChange={setAppointmentType}
                options={APPOINTMENT_TYPES}
              />
            </div>

            <div>
              <FieldLabel>
                Notes{" "}
                <span style={{ fontFamily: "inherit" }} className="font-normal normal-case tracking-normal text-[#c0c8c3]">
                  (optional)
                </span>
              </FieldLabel>
              <textarea
                value={patientNotes}
                onChange={(e) => setPatientNotes(e.target.value)}
                rows={4}
                placeholder="Anything you'd like your clinician to know beforehand…"
                className={textareaClass}
              />
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">{error}</p>
          )}

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#F0F4F0] pt-5">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-[10px] px-4 py-2 text-[13.5px] font-semibold text-[#8a988f] transition hover:text-[#5a6a60]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !scheduledAt}
              className="rounded-[10px] bg-[#1F8A5B] px-5 py-2 text-[13.5px] font-semibold text-white hover:bg-[#17764e] disabled:opacity-50"
            >
              {submitting ? "Booking…" : "Book Appointment"}
            </button>
          </div>
        </div>

        {/* Right column — inline calendar */}
        <CalendarPanel onChange={setScheduledAt} />
      </div>
    </form>
  );
}
