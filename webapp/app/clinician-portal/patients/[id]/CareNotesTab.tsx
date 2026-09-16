"use client";

import { useState } from "react";
import { mono } from "../../ClinicianPortalSidebar";
import { CareNoteComposer } from "./CareNoteComposer";
import type { PatientAppointment, PatientNote } from "./patient-chart-types";

type Props = {
  appointments: PatientAppointment[];
  notes: PatientNote[];
};

const FILTERS: { value: PatientNote["noteType"] | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "general", label: "General" },
  { value: "coordination", label: "Care team" },
  { value: "clinical_summary", label: "Clinical summary" },
  { value: "discharge", label: "Discharge" },
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function CareNotesTab({ appointments, notes }: Props) {
  const [filter, setFilter] = useState<PatientNote["noteType"] | "all">("all");
  const sorted = [...notes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const filtered = filter === "all" ? sorted : sorted.filter((n) => n.noteType === filter);

  return (
    <div className="flex flex-col gap-3.5">
      <CareNoteComposer appointments={appointments} />

      <div className="rounded-[14px] border border-[rgba(18,61,43,.08)] bg-white overflow-hidden">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-[rgba(18,61,43,.08)] px-5 py-4">
          <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#8C9A91]" style={mono}>
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </span>
          <div className="flex-1" />
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`rounded-lg px-2.5 py-1.5 text-[10.5px] font-semibold transition ${
                  filter === f.value ? "bg-[#e7f0e9] text-[#0f5132]" : "text-[#7a8a80] hover:bg-[#f4f6f4]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="px-5 py-6 text-sm text-[#8C9A91]">
            {notes.length === 0 ? "No care notes yet." : "No notes match this filter."}
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-[rgba(18,61,43,.06)]">
            {filtered.map((n) => (
              <div key={n.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-md bg-[#e7f0e9] px-2 py-0.5 text-[9.5px] font-semibold tracking-[.06em] text-[#0f5132]"
                    style={mono}
                  >
                    {noteTypeLabel(n.noteType)}
                  </span>
                  <span className="text-[10.5px] text-[#9aa8a0]" style={mono}>
                    {formatDate(n.createdAt)}
                    {n.appointmentDate ? ` · visit ${formatDate(n.appointmentDate)}` : ""}
                  </span>
                  {n.flagForFollowUp && (
                    <span className="rounded-md bg-[#fdf7e8] px-2 py-0.5 text-[9.5px] font-semibold tracking-[.06em] text-[#B8860B]" style={mono}>
                      FLAGGED FOR FOLLOW-UP
                    </span>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-[12.5px] leading-relaxed text-[#5a6a61]">
                  {n.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
