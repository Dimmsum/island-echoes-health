"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { needsAttention } from "./CareContinuityPanel";
import { updateFollowUp } from "./follow-up-actions";
import type { FollowUp } from "./follow-up-types";
import type { CareContinuityPatient } from "./CareContinuityPanel";

type PatientWithPlan = {
  patient_id: string;
  patient_name: string | null;
  patient_avatar: string | null;
  patient_age: number | null;
  plan_name: string;
  plan_id: string | null;
  started_at: string | null;
  next_appointment: string | null;
  next_appointment_clinician: string | null;
};

export type AgendaItem = {
  id: string;
  patientId: string;
  patientName: string;
  scheduledAt: string;
  status: "scheduled" | "completed" | "no_show" | "cancelled";
  appointmentType: string | null;
};

type Stats = {
  totalPatients: number;
  upcomingAppointments: number;
  todayAppointments: number;
};

type Props = {
  fullName: string | null;
  avatarUrl: string | null;
  role: "admin" | "clinician";
  patientsWithPlans: PatientWithPlan[];
  stats: Stats;
  followUps: FollowUp[];
  followUpPatientNames: Record<string, string>;
  careContinuityPatients: CareContinuityPatient[];
  todayAgenda: AgendaItem[];
};

const sans = { fontFamily: "var(--font-hanken, 'Hanken Grotesk', sans-serif)" };
const mono = { fontFamily: "var(--font-ibm-mono, 'IBM Plex Mono', monospace)" };

function CalendarIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function UsersIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function UserIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function ShieldIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" />
    </svg>
  );
}

function ChevronIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function humanizeType(type: string | null): string {
  if (!type) return "Appointment";
  return type
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

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

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", href: "/clinician-portal", icon: CalendarIcon },
  { key: "patients", label: "Patients", href: "#patients", icon: UsersIcon },
  { key: "appointments", label: "Appointments", href: "/clinician-portal/appointments", icon: CalendarIcon },
  { key: "profile", label: "Profile", href: "/clinician-portal/profile", icon: UserIcon },
] as const;

export function ClinicianPortalDashboard({
  fullName,
  avatarUrl,
  role,
  patientsWithPlans,
  stats,
  followUps,
  followUpPatientNames,
  careContinuityPatients,
  todayAgenda,
}: Props) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingFollowUp, setPendingFollowUp] = useState<string | null>(null);

  const roleLabel = role === "clinician" ? "Clinician" : "Admin";
  const now = new Date();
  const greeting = `${greetingForHour(now.getHours())}, ${fullName ?? roleLabel}`;
  const todayLabel = now.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const flaggedPatients = careContinuityPatients.filter(needsAttention);

  const filteredPatients = patientsWithPlans.filter((p) =>
    p.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  async function handleCompleteFollowUp(f: FollowUp) {
    setPendingFollowUp(f.id);
    const result = await updateFollowUp(f.id, { status: "completed" }, f.appointmentId ?? undefined);
    setPendingFollowUp(null);
    if (!result.error) router.refresh();
  }

  const navLinks = role === "admin" ? [...NAV_ITEMS, { key: "admin", label: "Admin", href: "/admin", icon: ShieldIcon }] : NAV_ITEMS;

  return (
    <div className="flex min-h-screen bg-[#f4f6f4]" style={sans}>
      {/* Sidebar */}
      <aside
        className={`relative flex flex-none flex-col gap-6 bg-[#0f3d2b] py-5 transition-[width] duration-300 ease-in-out ${
          collapsed ? "w-[76px] px-3" : "w-[220px] px-4"
        }`}
      >
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full border border-[rgba(18,61,43,.14)] bg-white text-[#0f5132] shadow-sm transition-transform duration-300 hover:bg-[#f4f6f4]"
        >
          <ChevronIcon className={`h-3.5 w-3.5 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
        </button>

        <Link href="/clinician-portal" className="flex items-center gap-2.5 overflow-hidden">
          <Image
            src="/island-echoes-icon.svg"
            alt="Island Echoes Health"
            width={28}
            height={28}
            priority
            className="h-7 w-7 shrink-0 brightness-0 invert"
          />
          <div
            className={`whitespace-nowrap text-[9px] font-bold uppercase leading-tight tracking-wide text-white transition-opacity duration-200 ${
              collapsed ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
          >
            Island
            <br />
            Echoes
            <br />
            <span className="font-normal text-[#8fb5a0]">Health</span>
          </div>
        </Link>

        <nav className="flex flex-col gap-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === "dashboard";
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center gap-2.5 overflow-hidden rounded-[9px] px-2.5 py-2.5 text-[12.5px] font-medium transition ${
                  isActive ? "bg-white/12 text-white" : "text-[#a9c6b7] hover:bg-white/8 hover:text-white"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                <span
                  className={`whitespace-nowrap transition-opacity duration-200 ${
                    collapsed ? "pointer-events-none opacity-0" : "opacity-100"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        <div className="flex items-center gap-2.5 overflow-hidden rounded-[11px] bg-white/8 p-2.5">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#dff0e4] text-[11px] font-semibold text-[#0f5132]">
              {initialsFor(fullName)}
            </div>
          )}
          <div className={`min-w-0 whitespace-nowrap transition-opacity duration-200 ${collapsed ? "pointer-events-none opacity-0" : "opacity-100"}`}>
            <div className="truncate text-[11.5px] font-semibold text-white">{fullName ?? roleLabel}</div>
            <div className="text-[10px] text-[#8fb5a0]">{roleLabel}</div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1 px-6 py-6 sm:px-8 sm:py-7">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <h1 className="text-[25px] font-bold leading-tight text-[#14251c]">{greeting}</h1>
              <p className="mt-1 text-[12.5px] text-[#7a8a80]">{todayLabel}</p>
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
                className="w-full rounded-[10px] border border-[rgba(18,61,43,.14)] bg-white py-2.5 pl-9 pr-3 text-[12px] text-[#14251c] placeholder:text-[#9aa8a0] focus:outline-none focus:ring-2 focus:ring-[#0f5132]/20 sm:w-64"
              />
            </div>
            <Link
              href="/clinician-portal/appointments"
              className="rounded-[10px] bg-[#0f5132] px-4 py-2.5 text-center text-[12.5px] font-semibold text-white transition hover:bg-[#0c3f28]"
            >
              Manage appointments
            </Link>
          </div>

          {/* Metric strip */}
          <div className="flex flex-wrap items-center rounded-[14px] border border-[rgba(18,61,43,.08)] bg-white px-5 py-4 sm:flex-nowrap">
            {[
              { label: "Appointments today", value: stats.todayAppointments, color: "#14251c" },
              { label: "Next 7 days", value: stats.upcomingAppointments, color: "#14251c" },
              { label: "Needs attention", value: flaggedPatients.length, color: flaggedPatients.length > 0 ? "#C0705A" : "#14251c" },
              { label: "Open follow-ups", value: followUps.length, color: "#14251c" },
              { label: "Panel", value: stats.totalPatients, color: "#14251c" },
            ].map((m, i) => (
              <div key={m.label} className={`flex-1 basis-1/2 py-2 sm:basis-0 sm:py-0 ${i > 0 ? "border-t border-[rgba(18,61,43,.1)] pt-3 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0" : ""}`}>
                <div className="text-[9.5px] font-semibold uppercase tracking-[.12em] text-[#8C9A91]" style={mono}>
                  {m.label}
                </div>
                <div className="mt-2 text-[25px] font-semibold leading-none" style={{ color: m.color }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>

          {/* Agenda + attention/follow-ups */}
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.15fr_1fr]">
            <div className="rounded-[14px] border border-[rgba(18,61,43,.08)] bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#8C9A91]" style={mono}>
                  Agenda
                </span>
                <span className="text-[11px] text-[#9aa8a0]" style={mono}>
                  {now.toLocaleDateString("en-US", { day: "numeric", month: "short" }).toUpperCase()}
                </span>
              </div>

              {todayAgenda.length === 0 ? (
                <p className="mt-6 text-[12.5px] text-[#8C9A91]">No appointments scheduled today.</p>
              ) : (
                <div className="mt-4 flex flex-col divide-y divide-[rgba(18,61,43,.08)]">
                  {todayAgenda.map((item) => {
                    const isCancelled = item.status === "cancelled" || item.status === "no_show";
                    return (
                      <div key={item.id} className="grid grid-cols-[52px_1fr] gap-3 py-3 first:pt-0 last:pb-0">
                        <div className="pt-3 text-[10.5px] font-semibold text-[#9aa8a0]" style={mono}>
                          {formatTime(item.scheduledAt)}
                        </div>
                        <div
                          className={`rounded-[11px] px-3.5 py-3 ${
                            isCancelled ? "border border-dashed border-[rgba(18,61,43,.16)]" : "bg-[#f4f6f4]"
                          }`}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ background: isCancelled ? "#C0705A" : item.status === "completed" ? "#157347" : "#E3B341" }}
                            />
                            <span className="text-[13px] font-semibold text-[#14251c]">{item.patientName}</span>
                            {isCancelled && (
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#C0705A]" style={mono}>
                                {item.status === "no_show" ? "No-show" : "Cancelled"}
                              </span>
                            )}
                          </div>
                          <div className="mt-1.5 text-[11.5px] text-[#8C9A91]">{humanizeType(item.appointmentType)}</div>
                          <div className="mt-2.5 flex gap-2">
                            <Link
                              href={`/clinician-portal/appointments?patient=${item.patientId}`}
                              className="rounded-[8px] border border-[rgba(18,61,43,.14)] px-3 py-1.5 text-[11px] font-medium text-[#5a6a61] transition hover:bg-white"
                            >
                              Open chart
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              {/* Attention queue */}
              <div className="rounded-[14px] border border-[rgba(18,61,43,.08)] bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#8C9A91]" style={mono}>
                    Attention queue
                  </span>
                  {flaggedPatients.length > 0 && (
                    <span className="text-[11px] font-semibold text-[#C0705A]" style={mono}>
                      {flaggedPatients.length} PATIENT{flaggedPatients.length === 1 ? "" : "S"}
                    </span>
                  )}
                </div>

                {flaggedPatients.length === 0 ? (
                  <p className="mt-4 text-[12.5px] text-[#8C9A91]">No care gaps detected.</p>
                ) : (
                  <div className="mt-3.5 flex flex-col gap-2.5">
                    {flaggedPatients.slice(0, 5).map((p) => {
                      const color = colorFor(p.patientId);
                      return (
                        <div
                          key={p.patientId}
                          className={`rounded-[11px] border p-3 ${
                            p.overdueFollowUpsCount > 0 ? "border-[rgba(192,112,90,.28)] bg-[#fdf6f4]" : "border-[rgba(18,61,43,.1)]"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-[9px] text-[10.5px] font-semibold"
                              style={{ background: color.bg, color: color.text }}
                            >
                              {initialsFor(p.patientName)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[12.5px] font-semibold text-[#14251c]">{p.patientName}</div>
                              <div className="truncate text-[10.5px] uppercase text-[#9aa8a0]" style={mono}>
                                {p.daysSinceLastAppointment === null
                                  ? "Never seen"
                                  : `${p.daysSinceLastAppointment} days unseen`}
                                {p.overdueFollowUpsCount > 0 ? ` · ${p.overdueFollowUpsCount} overdue` : ""}
                              </div>
                            </div>
                            <Link
                              href={`/clinician-portal/appointments?patient=${p.patientId}`}
                              className={`shrink-0 rounded-[8px] px-3 py-1.5 text-[11px] font-semibold ${
                                p.overdueFollowUpsCount > 0 ? "bg-[#0f5132] text-white" : "bg-[#e7f0e9] text-[#0f5132]"
                              }`}
                            >
                              Book
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                    {flaggedPatients.length > 5 && (
                      <a href="#patients" className="pt-1 text-center text-[11.5px] font-semibold text-[#157347]">
                        Show {flaggedPatients.length - 5} more →
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* For review (open follow-ups) */}
              <div className="rounded-[14px] border border-[rgba(18,61,43,.08)] bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#8C9A91]" style={mono}>
                    For review
                  </span>
                  <span className="text-[11px] font-semibold text-[#B8860B]" style={mono}>
                    {followUps.length} OPEN
                  </span>
                </div>

                {followUps.length === 0 ? (
                  <p className="mt-4 text-[12.5px] text-[#8C9A91]">No open follow-ups.</p>
                ) : (
                  <div className="mt-3.5 flex flex-col gap-3">
                    {followUps.slice(0, 5).map((f) => (
                      <div key={f.id} className="flex items-start gap-2.5 border-b border-[rgba(18,61,43,.07)] pb-3 last:border-0 last:pb-0">
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: f.overdue ? "#C0705A" : "#E3B341" }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[12.5px] font-semibold text-[#14251c]">
                            {followUpPatientNames[f.patientId] ?? "Patient"}
                          </div>
                          <div className="mt-0.5 text-[11px] text-[#8C9A91]">
                            {f.overdue ? "Overdue" : "Due"}{" "}
                            {new Date(f.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            {f.notes ? ` · ${f.notes}` : ""}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCompleteFollowUp(f)}
                          disabled={pendingFollowUp !== null}
                          className="shrink-0 text-[11px] font-semibold text-[#157347] disabled:opacity-50"
                        >
                          {pendingFollowUp === f.id ? "Saving…" : "Mark done"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Patients & Care Plans */}
          <section id="patients" className="scroll-mt-6 rounded-[14px] border border-[rgba(18,61,43,.08)] bg-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-[17px] font-semibold text-[#14251c]">Your patients</h2>
                <p className="mt-1 text-[12.5px] text-[#7a8a80]">Patients with active care plans</p>
              </div>
            </div>

            {filteredPatients.length === 0 ? (
              <div className="mt-5 rounded-[12px] border-2 border-dashed border-[rgba(18,61,43,.14)] bg-[#f4f6f4] p-10 text-center">
                <p className="text-[13px] font-medium text-[#14251c]">
                  {searchQuery ? "No patients found" : "No patients yet"}
                </p>
                <p className="mt-1 text-[12px] text-[#8C9A91]">
                  {searchQuery
                    ? "Try adjusting your search"
                    : "When sponsors purchase plans and patients accept, they will appear here."}
                </p>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPatients.map((patient) => {
                  const continuity = careContinuityPatients.find((c) => c.patientId === patient.patient_id);
                  const flagged = continuity ? needsAttention(continuity) : false;
                  const status = continuity && continuity.overdueFollowUpsCount > 0 ? "AT RISK" : flagged ? "REVIEW" : "STABLE";
                  const statusColor =
                    status === "AT RISK"
                      ? { bg: "#f7ebe7", text: "#C0705A" }
                      : status === "REVIEW"
                        ? { bg: "#fdf7e8", text: "#B8860B" }
                        : { bg: "#e7f0e9", text: "#157347" };
                  const color = colorFor(patient.patient_id);

                  return (
                    <div key={patient.patient_id} className="rounded-[12px] border border-[rgba(18,61,43,.1)] p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[11px] text-[13px] font-semibold"
                          style={{ background: color.bg, color: color.text }}
                        >
                          {patient.patient_avatar ? (
                            <img
                              src={patient.patient_avatar}
                              alt=""
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                e.currentTarget.nextElementSibling?.classList.remove("hidden");
                              }}
                            />
                          ) : null}
                          <span className={patient.patient_avatar ? "hidden" : ""}>
                            {initialsFor(patient.patient_name)}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[14px] font-semibold text-[#14251c]">{patient.patient_name}</div>
                          {patient.patient_age !== null && (
                            <div className="text-[11px] text-[#8C9A91]">{patient.patient_age} years old</div>
                          )}
                        </div>
                        <span
                          className="shrink-0 rounded-full px-2.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[.08em]"
                          style={{ background: statusColor.bg, color: statusColor.text }}
                        >
                          {status}
                        </span>
                      </div>

                      <div className="mt-3.5 flex flex-wrap gap-1.5">
                        <span className="rounded-[7px] bg-[#f4f6f4] px-2.5 py-1 text-[11px] font-medium text-[#3d4a43]">
                          {patient.plan_name}
                        </span>
                      </div>

                      <div className="mt-3.5 flex items-center justify-between border-t border-[rgba(18,61,43,.08)] pt-3">
                        <span className="text-[11.5px] text-[#8C9A91]">
                          {patient.next_appointment
                            ? `Next visit ${new Date(patient.next_appointment).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                            : "No visit booked"}
                        </span>
                        <Link
                          href={`/clinician-portal/appointments?patient=${patient.patient_id}`}
                          className="rounded-[8px] bg-[#e7f0e9] px-3 py-1.5 text-[11.5px] font-semibold text-[#0f5132] transition hover:bg-[#dcecdf]"
                        >
                          Open chart
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
