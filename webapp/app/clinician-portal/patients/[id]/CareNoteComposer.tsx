"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CustomTextArea } from "../../../components/CustomTextArea";
import { addAppointmentNote } from "../../../home/clinician-actions";
import type { PatientAppointment } from "./patient-chart-types";

// Mirrors the real `note_type` enum (supabase/migrations/00035_structured_clinic_notes.sql).
// The mockup's tab labels ("Consult/Phone/Sponsor report") don't match this enum, so tabs are
// relabeled to the actual values rather than inventing types the backend doesn't support.
const NOTE_TYPES = [
  { value: "general", label: "General" },
  { value: "coordination", label: "Care team (internal)" },
  { value: "clinical_summary", label: "Clinical summary" },
  { value: "discharge", label: "Discharge" },
] as const;
type NoteTypeValue = (typeof NOTE_TYPES)[number]["value"];

type Props = {
  appointments: PatientAppointment[];
};

function formatOption(a: PatientAppointment) {
  const date = new Date(a.scheduledAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${date} · ${a.status}`;
}

export function CareNoteComposer({ appointments }: Props) {
  const router = useRouter();
  const sortedAppointments = [...appointments].sort(
    (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
  );
  const [noteType, setNoteType] = useState<NoteTypeValue>("general");
  const [appointmentId, setAppointmentId] = useState(sortedAppointments[0]?.id ?? "");
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (sortedAppointments.length === 0) {
    return (
      <div className="rounded-2xl border border-[rgba(18,61,43,.08)] bg-white p-6">
        <div className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#8C9A91]">
          Write a care note
        </div>
        <p className="mt-3 text-sm text-[#7a8a80]">
          Book a visit first to add a care note — every note is attached to a specific
          appointment.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) {
      setError("Note content is required.");
      return;
    }
    if (!appointmentId) {
      setError("Select the visit this note belongs to.");
      return;
    }
    setError(null);
    setPending(true);
    const result = await addAppointmentNote(appointmentId, content.trim(), noteType);
    setPending(false);
    if (result.error) setError(result.error);
    else {
      setContent("");
      router.refresh();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[rgba(18,61,43,.08)] bg-white p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#8C9A91]">
          Write a care note
        </span>
        <div className="flex flex-wrap gap-1.5">
          {NOTE_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setNoteType(t.value)}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
                noteType === t.value
                  ? "bg-[#0f5132] text-white"
                  : "bg-[#f4f6f4] text-[#5a6a61] hover:bg-[#e7f0e9]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="care-note-visit" className="block text-xs font-medium uppercase tracking-wider text-slate-500">
          Related visit
        </label>
        <select
          id="care-note-visit"
          value={appointmentId}
          onChange={(e) => setAppointmentId(e.target.value)}
          className="mt-1.5 block w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-colors focus:border-[#1F5F2E] focus:outline-none focus:ring-2 focus:ring-[#1F5F2E]/20"
        >
          {sortedAppointments.map((a) => (
            <option key={a.id} value={a.id}>
              {formatOption(a)}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3">
        <CustomTextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type the note…"
          rows={4}
        />
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[#0f5132] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0c3f28] disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add note"}
        </button>
      </div>
    </form>
  );
}
