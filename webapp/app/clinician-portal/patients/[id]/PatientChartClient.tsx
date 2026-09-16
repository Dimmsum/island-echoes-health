"use client";

import { useState } from "react";
import { ClinicianPortalSidebar, sans, mono } from "../../ClinicianPortalSidebar";
import type { FollowUp } from "../../follow-up-types";
import type { StatusUpdate } from "../../status-update-types";
import type { PatientCondition } from "../../condition-types";
import type { Medication } from "../../medication-types";
import type { LabResult } from "../../lab-result-types";
import { FollowUpsSection } from "../../appointments/[id]/FollowUpsSection";
import { StatusUpdatesSection } from "../../appointments/[id]/StatusUpdatesSection";
import { ConditionsSection } from "../../appointments/[id]/ConditionsSection";
import { MedicationsSection } from "../../appointments/[id]/MedicationsSection";
import { LabResultsSection } from "../../appointments/[id]/LabResultsSection";
import { QuickBookWidget } from "./QuickBookWidget";
import { CareNoteComposer } from "./CareNoteComposer";
import { PatientTimeline } from "./PatientTimeline";
import { AppointmentsTab } from "./AppointmentsTab";
import { SponsorshipTab } from "./SponsorshipTab";
import type { PatientAppointment, PatientNote, PatientWallet, SponsorLink } from "./patient-chart-types";

type Tab = "overview" | "care-notes" | "appointments" | "labs" | "medications" | "sponsorship";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "care-notes", label: "Care notes" },
  { key: "appointments", label: "Appointments" },
  { key: "labs", label: "Labs & vitals" },
  { key: "medications", label: "Medications" },
  { key: "sponsorship", label: "Sponsorship" },
];

type Props = {
  clinicianName: string | null;
  clinicianAvatarUrl: string | null;
  role: "admin" | "clinician";
  patientId: string;
  patientName: string | null;
  patientAvatarUrl: string | null;
  dateOfBirth: string | null;
  phone: string | null;
  appointments: PatientAppointment[];
  lastAppointment: PatientAppointment | null;
  nextAppointment: PatientAppointment | null;
  latestBp: { systolic: number; diastolic: number; recordedAt: string } | null;
  sponsors: SponsorLink[];
  followUps: FollowUp[];
  statusUpdates: StatusUpdate[];
  conditions: PatientCondition[];
  medications: Medication[];
  labResults: LabResult[];
  notes: PatientNote[];
  wallet: PatientWallet | null;
};

function initialsFor(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function ageFrom(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

// There's no MRN field in the schema — this is a stable-looking display convenience derived
// from the patient's own id, not a real medical record number.
function pseudoMrn(patientId: string) {
  return `MRN-${patientId.replace(/-/g, "").slice(-6).toUpperCase()}`;
}

function isChangedToday(m: Medication) {
  const today = new Date().toISOString().slice(0, 10);
  return m.active && m.startedAt === today;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[9.5px] font-semibold uppercase tracking-[.12em] text-[#8C9A91]" style={mono}>
      {children}
    </div>
  );
}

export function PatientChartClient({
  clinicianName,
  clinicianAvatarUrl,
  role,
  patientId,
  patientName,
  patientAvatarUrl,
  dateOfBirth,
  phone,
  appointments,
  lastAppointment,
  nextAppointment,
  latestBp,
  sponsors,
  followUps,
  statusUpdates,
  conditions,
  medications,
  labResults,
  notes,
  wallet,
}: Props) {
  const [tab, setTab] = useState<Tab>("overview");

  const openFollowUps = followUps.filter((f) => f.status === "pending");
  const allergies = conditions.filter((c) => c.type === "allergy");
  const nonAllergyConditions = conditions.filter((c) => c.type === "condition");
  const activeMedications = medications.filter((m) => m.active);

  const sponsorSummary =
    sponsors.length === 0
      ? "Self-funded"
      : sponsors.length === 1
        ? sponsors[0].sponsorName ?? "Sponsor"
        : `${sponsors[0].sponsorName ?? "Sponsor"} +${sponsors.length - 1} more`;

  return (
    <div className="flex min-h-screen bg-[#f4f6f4]" style={sans}>
      <ClinicianPortalSidebar
        fullName={clinicianName}
        avatarUrl={clinicianAvatarUrl}
        role={role}
        activeKey="patients"
      />

      <main className="min-w-0 flex-1">
        {/* Patient banner */}
        <div className="border-b border-[rgba(18,61,43,.08)] bg-white px-6 pt-5 sm:px-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#e7f0e9] text-[17px] font-semibold text-[#0f5132]">
              {patientAvatarUrl ? (
                <img src={patientAvatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initialsFor(patientName)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[19px] font-bold text-[#14251c]">{patientName ?? "Patient"}</span>
                {openFollowUps.length > 0 && (
                  <span
                    className="rounded-full bg-[#fdf7e8] px-2.5 py-0.5 text-[9px] font-semibold tracking-[.08em] text-[#B8860B]"
                    style={mono}
                  >
                    {openFollowUps.length} FOLLOW-UP{openFollowUps.length === 1 ? "" : "S"}
                  </span>
                )}
              </div>
              <div className="mt-1.5 text-[11.5px] text-[#8C9A91]">
                {[
                  ageFrom(dateOfBirth) !== null ? `${ageFrom(dateOfBirth)}` : null,
                  pseudoMrn(patientId),
                  nonAllergyConditions.slice(0, 2).map((c) => c.label).join(", ") || null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </div>
            <div className="flex flex-none gap-4 pr-1.5">
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-[.1em] text-[#9aa8a0]" style={mono}>
                  Last visit
                </div>
                <div className="mt-1 whitespace-nowrap text-[12.5px] font-semibold text-[#14251c]">
                  {lastAppointment ? formatDate(lastAppointment.scheduledAt) : "—"}
                </div>
              </div>
              <div className="w-px bg-[rgba(18,61,43,.1)]" />
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-[.1em] text-[#9aa8a0]" style={mono}>
                  Next visit
                </div>
                <div className="mt-1 whitespace-nowrap text-[12.5px] font-semibold text-[#14251c]">
                  {nextAppointment ? formatDate(nextAppointment.scheduledAt) : "—"}
                </div>
              </div>
              <div className="w-px bg-[rgba(18,61,43,.1)]" />
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-[.1em] text-[#9aa8a0]" style={mono}>
                  Latest BP
                </div>
                <div className="mt-1 whitespace-nowrap text-[12.5px] font-semibold text-[#B8860B]">
                  {latestBp ? `${latestBp.systolic}/${latestBp.diastolic}` : "—"}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4.5 flex gap-6 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`whitespace-nowrap pb-3 text-[12.5px] font-semibold transition ${
                  tab === t.key
                    ? "border-b-2 border-[#0f5132] text-[#0f5132]"
                    : "border-b-2 border-transparent text-[#7a8a80] hover:text-[#14251c]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="px-6 py-6 sm:px-8 sm:py-6.5">
          {tab === "overview" && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[268px_1fr] lg:items-start">
              {/* Facts rail */}
              <div className="flex flex-col gap-3.5">
                <div className="rounded-[14px] border border-[rgba(18,61,43,.08)] bg-white p-[18px]">
                  <CardLabel>Patient</CardLabel>
                  <div className="mt-3.5 flex flex-col gap-2.5">
                    <div>
                      <div className="text-[10px] font-medium text-[#9aa8a0]" style={mono}>Date of birth</div>
                      <div className="mt-0.5 text-xs font-medium text-[#14251c]">
                        {dateOfBirth ? formatDate(dateOfBirth) : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-[#9aa8a0]" style={mono}>Phone</div>
                      <div className="mt-0.5 text-xs font-medium text-[#14251c]">{phone ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-[#9aa8a0]" style={mono}>Sponsor</div>
                      <button
                        type="button"
                        onClick={() => setTab("sponsorship")}
                        className="mt-0.5 block text-left text-xs font-medium text-[#14251c] underline decoration-dotted hover:text-[#0f5132]"
                      >
                        {sponsorSummary}
                      </button>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-[#9aa8a0]" style={mono}>Allergies</div>
                      {allergies.length === 0 ? (
                        <div className="mt-0.5 text-xs font-medium text-[#14251c]">None recorded</div>
                      ) : (
                        <div className="mt-0.5 text-xs font-medium text-[#C0705A]">
                          {allergies.map((a) => a.label).join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-[14px] border border-[rgba(18,61,43,.08)] bg-white p-[18px]">
                  <CardLabel>Current meds</CardLabel>
                  {activeMedications.length === 0 ? (
                    <p className="mt-3 text-xs text-[#8C9A91]">No active medications.</p>
                  ) : (
                    <div className="mt-3.5 flex flex-col gap-2.5">
                      {activeMedications.map((m) => (
                        <div key={m.id} className="flex items-baseline justify-between gap-2">
                          <span className="text-xs font-medium text-[#14251c]">{m.name}</span>
                          <span className="text-right text-[10.5px] font-medium text-[#8C9A91]" style={mono}>
                            {[m.dosage, m.frequency].filter(Boolean).join(" · ") || "—"}
                            {isChangedToday(m) && (
                              <span className="ml-1.5 font-semibold text-[#157347]"> · CHANGED TODAY</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <FollowUpsSection patientId={patientId} followUps={openFollowUps} />
              </div>

              {/* Main column */}
              <div className="flex flex-col gap-3.5">
                <QuickBookWidget patientId={patientId} nextAppointment={nextAppointment} />
                <CareNoteComposer appointments={appointments} />
                <StatusUpdatesSection patientId={patientId} statusUpdates={statusUpdates} />
                <PatientTimeline
                  appointments={appointments}
                  notes={notes}
                  statusUpdates={statusUpdates}
                  labResults={labResults}
                />
              </div>
            </div>
          )}

          {tab === "care-notes" && (
            <div className="flex flex-col gap-3.5">
              <CareNoteComposer appointments={appointments} />
              <div className="rounded-[14px] border border-[rgba(18,61,43,.08)] bg-white p-5">
                <CardLabel>Note history</CardLabel>
                {notes.length === 0 ? (
                  <p className="mt-3 text-sm text-[#8C9A91]">No care notes yet.</p>
                ) : (
                  <ul className="mt-4 flex flex-col gap-3">
                    {notes.map((n) => (
                      <li key={n.id} className="rounded-xl bg-[#f4f6f4] px-4 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="text-[10px] font-semibold uppercase tracking-wide text-[#8C9A91]"
                            style={mono}
                          >
                            {n.noteType.replace(/_/g, " ")}
                          </span>
                          <span className="text-[10.5px] text-[#9aa8a0]" style={mono}>
                            {formatDate(n.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1.5 whitespace-pre-wrap text-xs text-[#5a6a61]">{n.content}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <StatusUpdatesSection patientId={patientId} statusUpdates={statusUpdates} />
            </div>
          )}

          {tab === "appointments" && <AppointmentsTab appointments={appointments} />}

          {tab === "labs" && <LabResultsSection patientId={patientId} labResults={labResults} />}

          {tab === "medications" && <MedicationsSection patientId={patientId} medications={medications} />}

          {tab === "sponsorship" && <SponsorshipTab sponsors={sponsors} wallet={wallet} />}

          {tab === "overview" && (
            <div className="mt-3.5">
              <ConditionsSection patientId={patientId} conditions={conditions} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
