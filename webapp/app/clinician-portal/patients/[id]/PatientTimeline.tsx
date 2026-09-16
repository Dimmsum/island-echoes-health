"use client";

import { useMemo, useState } from "react";
import type { StatusUpdate } from "../../status-update-types";
import type { LabResult } from "../../lab-result-types";
import type { PatientAppointment, PatientNote, TimelineEntry, TimelineEntryType } from "./patient-chart-types";

type Props = {
  appointments: PatientAppointment[];
  notes: PatientNote[];
  statusUpdates: StatusUpdate[];
  labResults: LabResult[];
};

const FILTERS: { value: TimelineEntryType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "note", label: "Notes" },
  { value: "visit", label: "Visits" },
  { value: "lab", label: "Labs" },
];

function noteTypeLabel(noteType: PatientNote["noteType"]) {
  switch (noteType) {
    case "coordination":
      return "CARE TEAM";
    case "clinical_summary":
      return "CLINICAL SUMMARY";
    case "discharge":
      return "DISCHARGE";
    default:
      return "GENERAL";
  }
}

function statusUpdateBadge(visibility: StatusUpdate["visibility"]) {
  switch (visibility) {
    case "sponsor_only":
      return "SPONSOR ONLY";
    case "patient_only":
      return "PATIENT ONLY";
    default:
      return "PATIENT + SPONSOR";
  }
}

function buildTimeline(
  appointments: PatientAppointment[],
  notes: PatientNote[],
  statusUpdates: StatusUpdate[],
  labResults: LabResult[],
): TimelineEntry[] {
  const now = new Date();

  const visitEntries: TimelineEntry[] = appointments
    .filter((a) => new Date(a.scheduledAt) <= now)
    .map((a) => ({
      id: `visit-${a.id}`,
      type: "visit",
      date: a.scheduledAt,
      title: a.appointmentType ? a.appointmentType.replace(/_/g, " ") : "Appointment",
      detail: `Status: ${a.status.replace(/_/g, " ")}`,
      author: null,
      badge: a.status.toUpperCase(),
    }));

  const noteEntries: TimelineEntry[] = notes.map((n) => ({
    id: `note-${n.id}`,
    type: "note",
    date: n.createdAt,
    title: "Care note",
    detail: n.content,
    author: null,
    badge: noteTypeLabel(n.noteType),
  }));

  const statusEntries: TimelineEntry[] = statusUpdates.map((s) => ({
    id: `status-${s.id}`,
    type: "note",
    date: s.createdAt,
    title: "Status update",
    detail: s.statusText,
    author: null,
    badge: statusUpdateBadge(s.visibility),
  }));

  const labEntries: TimelineEntry[] = labResults.map((l) => ({
    id: `lab-${l.id}`,
    type: "lab",
    date: l.drawnAt,
    title: l.testName,
    detail: `${l.value}${l.unit ? ` ${l.unit}` : ""}`,
    author: null,
    badge: l.panelType.replace(/_/g, " ").toUpperCase(),
  }));

  return [...visitEntries, ...noteEntries, ...statusEntries, ...labEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

export function PatientTimeline({ appointments, notes, statusUpdates, labResults }: Props) {
  const [filter, setFilter] = useState<TimelineEntryType | "all">("all");
  const entries = useMemo(
    () => buildTimeline(appointments, notes, statusUpdates, labResults),
    [appointments, notes, statusUpdates, labResults],
  );
  const filtered = filter === "all" ? entries : entries.filter((e) => e.type === filter);

  return (
    <div className="rounded-2xl border border-[rgba(18,61,43,.08)] bg-white p-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#8C9A91]">
          Patient timeline
        </span>
        <div className="flex-1" />
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`rounded-lg px-3 py-1.5 text-[10.5px] font-semibold transition ${
                filter === f.value ? "bg-[#e7f0e9] text-[#0f5132]" : "text-[#7a8a80] hover:bg-[#f4f6f4]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 text-sm text-[#8C9A91]">Nothing here yet.</p>
      ) : (
        <div className="mt-5 flex flex-col">
          {filtered.map((entry) => (
            <div key={entry.id} className="grid grid-cols-[64px_1fr] gap-4">
              <div className="pt-3.5 text-[10.5px] font-semibold text-[#9aa8a0]">
                {formatDate(entry.date)}
              </div>
              <div className="border-l border-[rgba(18,61,43,.1)] py-3 pl-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-semibold capitalize text-[#14251c]">{entry.title}</span>
                  {entry.badge && (
                    <span className="rounded-full bg-[#f4f6f4] px-2.5 py-0.5 text-[9px] font-semibold tracking-wide text-[#5a6a61]">
                      {entry.badge}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-[12px] leading-relaxed text-[#5a6a61]">
                  {entry.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
