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
import { QuickBookWidget } from "./QuickBookWidget";
import { CareNoteComposer } from "./CareNoteComposer";
import { CareNotesTab } from "./CareNotesTab";
import { PatientTimeline } from "./PatientTimeline";
import { AppointmentsTab } from "./AppointmentsTab";
import { VitalsTab } from "./VitalsTab";
import { MedicationsTab } from "./MedicationsTab";
import { SponsorshipTab } from "./SponsorshipTab";
import type {
  PatientAppointment,
  PatientNote,
  PatientWallet,
  SponsorLink,
  VitalsReading,
} from "./patient-chart-types";

type Tab = "overview" | "care-notes" | "appointments" | "vitals" | "medications" | "sponsorship";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "care-notes", label: "Care notes" },
  { key: "appointments", label: "Appointments" },
  { key: "vitals", label: "Vitals & labs" },
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
  latestWeightKg: number | null;
  latestA1c: number | null;
  vitalsHistory: VitalsReading[];
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatTile({
  label,
  value,
  sub,
  tone,
  onClick,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "amber" | "red";
  onClick?: () => void;
}) {
  const valueColor = tone === "red" ? "text-[#C0705A]" : tone === "amber" ? "text-[#B8860B]" : "text-[#14251c]";
  const body = (
    <>
      <div className="text-[9px] font-semibold uppercase tracking-[.1em] text-[#9aa8a0]" style={mono}>
        {label}
      </div>
      <div className={`mt-1.5 text-[13.5px] font-semibold ${valueColor}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-[#8C9A91]">{sub}</div>}
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="min-w-[120px] text-left">
        {body}
      </button>
    );
  }
  return <div className="min-w-[120px]">{body}</div>;
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
  latestWeightKg,
  latestA1c,
  vitalsHistory,
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
                {allergies.length > 0 && (
                  <span
                    className="rounded-full bg-[#f7ebe7] px-2.5 py-0.5 text-[9.5px] font-semibold tracking-[.08em] text-[#C0705A]"
                    style={mono}
                  >
                    ALLERGY: {allergies[0].label.toUpperCase()}
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
              {phone && <div className="mt-0.5 text-[11.5px] text-[#8C9A91]">{phone}</div>}
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

        {/* Tab content — single-column stacked bands, top to bottom */}
        <div className="flex flex-col gap-3.5 px-6 py-6 sm:px-8 sm:py-6.5">
          {tab === "overview" && (
            <>
              <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-[14px] border border-[rgba(18,61,43,.08)] bg-white p-5">
                <StatTile
                  label="Last appointment"
                  value={lastAppointment ? formatDate(lastAppointment.scheduledAt) : "—"}
                  sub={lastAppointment?.appointmentType?.replace(/_/g, " ")}
                />
                <div className="h-9 w-px self-stretch bg-[rgba(18,61,43,.1)]" />
                <StatTile
                  label="Next appointment"
                  value={nextAppointment ? formatDate(nextAppointment.scheduledAt) : "Not booked"}
                  sub={nextAppointment?.appointmentType?.replace(/_/g, " ")}
                />
                <div className="h-9 w-px self-stretch bg-[rgba(18,61,43,.1)]" />
                <StatTile
                  label="Open follow-ups"
                  value={String(openFollowUps.length)}
                  tone={openFollowUps.length > 0 ? "amber" : undefined}
                />
                <div className="h-9 w-px self-stretch bg-[rgba(18,61,43,.1)]" />
                <StatTile
                  label="Latest BP"
                  value={latestBp ? `${latestBp.systolic}/${latestBp.diastolic}` : "—"}
                  sub={latestBp ? formatDate(latestBp.recordedAt) : undefined}
                  tone={latestBp ? "amber" : undefined}
                />
                <div className="h-9 w-px self-stretch bg-[rgba(18,61,43,.1)]" />
                <StatTile label="Sponsor" value={sponsorSummary} onClick={() => setTab("sponsorship")} />
              </div>

              <FollowUpsSection patientId={patientId} followUps={openFollowUps} />

              <QuickBookWidget patientId={patientId} nextAppointment={nextAppointment} />

              <CareNoteComposer appointments={appointments} />

              <PatientTimeline
                appointments={appointments}
                notes={notes}
                statusUpdates={statusUpdates}
                labResults={labResults}
              />

              <StatusUpdatesSection patientId={patientId} statusUpdates={statusUpdates} />
            </>
          )}

          {tab === "care-notes" && <CareNotesTab appointments={appointments} notes={notes} />}

          {tab === "appointments" && (
            <AppointmentsTab patientId={patientId} appointments={appointments} nextAppointment={nextAppointment} />
          )}

          {tab === "vitals" && (
            <VitalsTab
              patientId={patientId}
              vitalsHistory={vitalsHistory}
              latestBp={latestBp}
              latestWeightKg={latestWeightKg}
              latestA1c={latestA1c}
              labResults={labResults}
            />
          )}

          {tab === "medications" && (
            <MedicationsTab patientId={patientId} medications={medications} conditions={conditions} />
          )}

          {tab === "sponsorship" && <SponsorshipTab sponsors={sponsors} wallet={wallet} />}
        </div>
      </main>
    </div>
  );
}
