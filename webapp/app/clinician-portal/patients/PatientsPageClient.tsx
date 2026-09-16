"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ClinicianPortalSidebar, sans, mono } from "../ClinicianPortalSidebar";
import type { RosterPatient } from "./roster-types";

type Props = {
  fullName: string | null;
  avatarUrl: string | null;
  role: "admin" | "clinician";
  patients: RosterPatient[];
};

const AVATAR_COLORS = [
  { bg: "#e7f0e9", text: "#0f5132" },
  { bg: "#f2e6e2", text: "#8a5b4d" },
  { bg: "#e5e9ef", text: "#5b6a7d" },
  { bg: "#efe4d8", text: "#8a6a45" },
  { bg: "#eceae4", text: "#6a7a70" },
];

function initialsFor(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function colorFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function daysBetween(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

type SortMode = "triage" | "az" | "lastSeen";

const BUCKET_META: Record<RosterPatient["bucket"], { label: string; dot: string; badgeBg: string; badgeText: string }> = {
  overdue: { label: "OVERDUE — ACTION NEEDED", dot: "#C0705A", badgeBg: "#f7ebe7", badgeText: "#C0705A" },
  open: { label: "OPEN FOLLOW-UPS & UPCOMING", dot: "#E3B341", badgeBg: "#fdf7e8", badgeText: "#B8860B" },
  onTrack: { label: "ON TRACK", dot: "#157347", badgeBg: "#e7f0e9", badgeText: "#157347" },
};

function PatientCard({ patient }: { patient: RosterPatient }) {
  const color = colorFor(patient.patientId);
  const meta = BUCKET_META[patient.bucket];
  const href = `/clinician-portal/patients/${patient.patientId}`;

  const lastLabel = patient.lastAppointment
    ? isToday(patient.lastAppointment.scheduledAt)
      ? "Today"
      : formatShortDate(patient.lastAppointment.scheduledAt)
    : "No visits";
  const lastSubLabel = patient.lastAppointment
    ? isToday(patient.lastAppointment.scheduledAt)
      ? "TODAY"
      : `${daysBetween(patient.lastAppointment.scheduledAt)} DAYS AGO`
    : "—";

  const nextLabel = patient.nextAppointment
    ? isToday(patient.nextAppointment.scheduledAt)
      ? "Today"
      : formatShortDate(patient.nextAppointment.scheduledAt)
    : "Not booked";
  const nextSubLabel = patient.nextAppointment
    ? isToday(patient.nextAppointment.scheduledAt)
      ? formatTime(patient.nextAppointment.scheduledAt)
      : formatTime(patient.nextAppointment.scheduledAt)
    : "";

  const bpTag =
    patient.latestBp &&
    (() => {
      const tagColor = patient.bucket === "overdue" ? { bg: "#f7ebe7", text: "#C0705A" } : { bg: "#fdf7e8", text: "#B8860B" };
      return (
        <span
          className="rounded-[7px] px-2.5 py-1 text-[11px] font-semibold"
          style={{ background: tagColor.bg, color: tagColor.text, ...mono }}
        >
          {patient.latestBp.systolic}/{patient.latestBp.diastolic}
        </span>
      );
    })();

  return (
    <div
      className="flex flex-col gap-3.5 rounded-[14px] border bg-white p-4.5"
      style={{ borderColor: patient.bucket === "overdue" ? "rgba(192,112,90,.3)" : "rgba(18,61,43,.1)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10.5 w-10.5 shrink-0 items-center justify-center rounded-[12px] text-[13.5px] font-semibold"
          style={{ background: color.bg, color: color.text }}
        >
          {initialsFor(patient.patientName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14.5px] font-semibold text-[#14251c]">{patient.patientName}</div>
          <div className="truncate text-[11px] text-[#8C9A91]">
            {patient.age !== null ? `${patient.age} yrs` : "Age unknown"}
          </div>
        </div>
        {patient.badge && (
          <span
            className="shrink-0 rounded-full px-2.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[.08em]"
            style={{ background: meta.badgeBg, color: meta.badgeText, ...mono }}
          >
            {patient.badge}
          </span>
        )}
      </div>

      {(patient.conditions.length > 0 || bpTag) && (
        <div className="flex flex-wrap gap-1.5">
          {patient.conditions.map((c) => (
            <span key={c} className="rounded-[7px] bg-[#f4f6f4] px-2.5 py-1 text-[11px] font-medium text-[#3d4a43]">
              {c}
            </span>
          ))}
          {bpTag}
        </div>
      )}

      {patient.topFollowUp && (
        <div
          className="flex gap-2.5 rounded-[11px] p-3"
          style={{ background: patient.bucket === "overdue" ? "#fdf6f4" : "#fdf7e8" }}
        >
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: meta.dot }} />
          <div>
            <div className="text-[12px] font-semibold text-[#14251c]">
              {patient.topFollowUp.overdue ? "Follow-up overdue" : "Follow-up due"}
            </div>
            <div className="mt-0.5 text-[11px]" style={{ color: patient.bucket === "overdue" ? "#8a5f52" : "#8a7a52" }}>
              {patient.topFollowUp.overdue
                ? `Due ${formatShortDate(patient.topFollowUp.dueDate)} · overdue by ${Math.max(0, daysBetween(patient.topFollowUp.dueDate))} days`
                : `Due ${formatShortDate(patient.topFollowUp.dueDate)}`}
              {patient.topFollowUp.notes ? ` · ${patient.topFollowUp.notes}` : ""}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-px overflow-hidden rounded-[10px] bg-[rgba(18,61,43,.08)]">
        <div className="flex-1 bg-[#fbfcfb] p-2.5">
          <div className="text-[9px] font-semibold uppercase tracking-[.1em] text-[#9aa8a0]" style={mono}>
            Last appt
          </div>
          <div className="mt-1 text-[12px] font-semibold text-[#14251c]">{lastLabel}</div>
          <div className="text-[10px]" style={{ color: patient.bucket === "overdue" ? "#C0705A" : "#9aa8a0", ...mono }}>
            {lastSubLabel}
          </div>
        </div>
        <div className="flex-1 bg-[#fbfcfb] p-2.5">
          <div className="text-[9px] font-semibold uppercase tracking-[.1em] text-[#9aa8a0]" style={mono}>
            Next appt
          </div>
          <div className="mt-1 text-[12px] font-semibold" style={{ color: patient.nextAppointment ? "#14251c" : "#9aa8a0" }}>
            {nextLabel}
          </div>
          <div className="text-[10px] text-[#9aa8a0]" style={mono}>
            {nextSubLabel}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          href={href}
          className="flex-1 rounded-[9px] py-2 text-center text-[12px] font-semibold text-white"
          style={{ background: "#0f5132" }}
        >
          {patient.bucket === "overdue" ? "Book visit" : patient.bucket === "open" ? "Resolve" : "View"}
        </Link>
        <Link
          href={href}
          className="flex-1 rounded-[9px] border border-[rgba(18,61,43,.14)] py-2 text-center text-[12px] font-semibold text-[#3d4a43]"
        >
          View patient
        </Link>
      </div>
    </div>
  );
}

function CompactPatientRow({ patient }: { patient: RosterPatient }) {
  const color = colorFor(patient.patientId);
  const href = `/clinician-portal/patients/${patient.patientId}`;
  const lastLabel = patient.lastAppointment ? `Last ${formatShortDate(patient.lastAppointment.scheduledAt)}` : "No visits";
  const nextLabel = patient.nextAppointment
    ? `Next ${isToday(patient.nextAppointment.scheduledAt) ? "today" : formatShortDate(patient.nextAppointment.scheduledAt)} ${formatTime(patient.nextAppointment.scheduledAt)}`
    : "Not booked";

  return (
    <div className="flex items-center gap-3.5 rounded-[14px] border border-[rgba(18,61,43,.08)] bg-white p-4">
      <div
        className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-[11px] text-[12.5px] font-semibold"
        style={{ background: color.bg, color: color.text }}
      >
        {initialsFor(patient.patientName)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-semibold text-[#14251c]">{patient.patientName}</div>
        <div className="mt-0.5 truncate text-[11px] text-[#8C9A91]">
          {lastLabel} · {nextLabel}
        </div>
      </div>
      <Link
        href={href}
        className="shrink-0 rounded-[8px] border border-[rgba(18,61,43,.14)] px-3 py-1.5 text-[11.5px] font-semibold text-[#3d4a43]"
      >
        View
      </Link>
    </div>
  );
}

export function PatientsPageClient({ fullName, avatarUrl, role, patients }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("triage");
  const [showAllOnTrack, setShowAllOnTrack] = useState(false);

  const filtered = useMemo(
    () => patients.filter((p) => p.patientName.toLowerCase().includes(searchQuery.toLowerCase())),
    [patients, searchQuery],
  );

  const overdue = filtered.filter((p) => p.bucket === "overdue");
  const open = filtered.filter((p) => p.bucket === "open");
  const onTrack = filtered.filter((p) => p.bucket === "onTrack");

  const flatSorted = useMemo(() => {
    const list = [...filtered];
    if (sortMode === "az") return list.sort((a, b) => a.patientName.localeCompare(b.patientName));
    if (sortMode === "lastSeen")
      return list.sort((a, b) => {
        const ad = a.lastAppointment ? new Date(a.lastAppointment.scheduledAt).getTime() : -Infinity;
        const bd = b.lastAppointment ? new Date(b.lastAppointment.scheduledAt).getTime() : -Infinity;
        return ad - bd;
      });
    return list;
  }, [filtered, sortMode]);

  const needsAttentionCount = overdue.length;

  return (
    <div className="flex min-h-screen bg-[#f4f6f4]" style={sans}>
      <ClinicianPortalSidebar fullName={fullName} avatarUrl={avatarUrl} role={role} activeKey="patients" />

      {/* Main content */}
      <main className="min-w-0 flex-1 px-6 py-6 sm:px-8 sm:py-7">
        <div className="mx-auto flex max-w-6xl flex-col gap-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span
                className="inline-flex rounded-full px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[.14em]"
                style={{ background: "#e7f0e9", color: "#157347", ...mono }}
              >
                My panel · {patients.length} patient{patients.length === 1 ? "" : "s"}
              </span>
              <h1 className="mt-2.5 text-[26px] font-bold leading-tight text-[#14251c]">Patients</h1>
              <p className="mt-1 text-[12.5px] text-[#7a8a80]">Grouped by what needs doing. Open a card for the full chart.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex h-10 items-center gap-0.5 rounded-[9px] border border-[rgba(18,61,43,.1)] bg-white p-0.5">
                {([
                  ["triage", "Triage"],
                  ["az", "A – Z"],
                  ["lastSeen", "Last seen"],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSortMode(value)}
                    className={`h-8 whitespace-nowrap rounded-[7px] px-3.5 text-[11.5px] font-semibold transition ${
                      sortMode === value ? "bg-[#e7f0e9] text-[#0f5132]" : "text-[#7a8a80]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="relative">
                <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa8a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search patients"
                  className="h-10 w-[230px] rounded-[9px] border border-[rgba(18,61,43,.14)] bg-white pl-9 pr-3 text-[12px] text-[#14251c] placeholder:text-[#9aa8a0] focus:outline-none focus:ring-2 focus:ring-[#0f5132]/20"
                />
              </div>
              <button
                type="button"
                disabled
                title="Coming soon"
                className="h-10 cursor-not-allowed rounded-[9px] bg-[#0f5132] px-4.5 text-[12px] font-semibold text-white opacity-90"
              >
                Add patient
              </button>
            </div>
          </div>

          {patients.length === 0 ? (
            <div className="rounded-[14px] border-2 border-dashed border-[rgba(18,61,43,.14)] bg-white p-10 text-center">
              <p className="text-[13px] font-medium text-[#14251c]">No patients yet</p>
              <p className="mt-1 text-[12px] text-[#8C9A91]">
                When sponsors purchase plans and patients accept, they will appear here.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-[14px] border-2 border-dashed border-[rgba(18,61,43,.14)] bg-white p-10 text-center">
              <p className="text-[13px] font-medium text-[#14251c]">No patients found</p>
              <p className="mt-1 text-[12px] text-[#8C9A91]">Try adjusting your search.</p>
            </div>
          ) : sortMode !== "triage" ? (
            <div className="flex flex-col gap-2.5">
              {flatSorted.map((p) => (
                <CompactPatientRow key={p.patientId} patient={p} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-7">
              {overdue.length > 0 && (
                <div>
                  <div className="flex items-center gap-2.5 pb-3">
                    <span className="h-2 w-2 rounded-full" style={{ background: BUCKET_META.overdue.dot }} />
                    <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#14251c]" style={mono}>
                      {BUCKET_META.overdue.label}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: BUCKET_META.overdue.badgeBg, color: BUCKET_META.overdue.badgeText, ...mono }}
                    >
                      {overdue.length}
                    </span>
                    <div className="h-px flex-1 bg-[rgba(18,61,43,.1)]" />
                  </div>
                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                    {overdue.map((p) => (
                      <PatientCard key={p.patientId} patient={p} />
                    ))}
                  </div>
                </div>
              )}

              {open.length > 0 && (
                <div>
                  <div className="flex items-center gap-2.5 pb-3">
                    <span className="h-2 w-2 rounded-full" style={{ background: BUCKET_META.open.dot }} />
                    <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#14251c]" style={mono}>
                      {BUCKET_META.open.label}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: BUCKET_META.open.badgeBg, color: BUCKET_META.open.badgeText, ...mono }}
                    >
                      {open.length}
                    </span>
                    <div className="h-px flex-1 bg-[rgba(18,61,43,.1)]" />
                  </div>
                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                    {open.map((p) => (
                      <PatientCard key={p.patientId} patient={p} />
                    ))}
                  </div>
                </div>
              )}

              {overdue.length === 0 && open.length === 0 && needsAttentionCount === 0 && (
                <div className="rounded-[14px] border-2 border-dashed border-[rgba(18,61,43,.14)] bg-white p-8 text-center">
                  <p className="text-[13px] font-medium text-[#14251c]">Nothing needs attention</p>
                  <p className="mt-1 text-[12px] text-[#8C9A91]">No overdue follow-ups or open tasks right now.</p>
                </div>
              )}

              {onTrack.length > 0 && (
                <div>
                  <div className="flex items-center gap-2.5 pb-3">
                    <span className="h-2 w-2 rounded-full" style={{ background: BUCKET_META.onTrack.dot }} />
                    <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#14251c]" style={mono}>
                      {BUCKET_META.onTrack.label}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: BUCKET_META.onTrack.badgeBg, color: BUCKET_META.onTrack.badgeText, ...mono }}
                    >
                      {onTrack.length}
                    </span>
                    <div className="h-px flex-1 bg-[rgba(18,61,43,.1)]" />
                    {onTrack.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setShowAllOnTrack((v) => !v)}
                        className="shrink-0 text-[11.5px] font-semibold text-[#157347]"
                      >
                        {showAllOnTrack ? "Show less" : "See all →"}
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                    {(showAllOnTrack ? onTrack : onTrack.slice(0, 3)).map((p) => (
                      <CompactPatientRow key={p.patientId} patient={p} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
