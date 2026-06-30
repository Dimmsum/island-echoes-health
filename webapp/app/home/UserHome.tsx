"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ConsentRequestCards } from "./ConsentRequestCards";
import { SupportPatientForm } from "./PurchasePlanForm";
import { UserNavbar } from "./UserNavbar";
import { CompactWallet } from "./CompactWallet";
import { fetchPatientWalletData, fetchPatientStatusUpdates, fetchPatientMetrics, fetchPatientFollowUps } from "./actions";
import type { WalletTransaction } from "./WalletCard";
import type { StatusUpdate } from "@/app/clinician-portal/status-update-types";
import type { PatientMetric, FollowUp } from "./actions";
import { SkeletonCard } from "./SkeletonCard";

type LinkedPatient = {
  id: string;
  started_at: string;
  care_plan: {
    id: string;
    name: string;
    slug: string;
    price_cents: number;
  } | null;
  patient: {
    id: string;
    full_name: string | null;
    age: number | null;
    avatar_url: string | null;
  } | null;
};

type MySponsor = {
  id: string;
  started_at: string;
  care_plan: { id: string; name: string } | null;
  sponsor: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

type PendingConsent = {
  id: string;
  patient_email: string;
  care_plan: { id: string; name: string } | null;
  sponsor_name: string;
};

type Appointment = {
  id: string;
  scheduled_at: string;
  status: string;
  clinician_name: string | null;
  clinician_avatar_url: string | null;
  patient_name: string | null;
};

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
  reference_id: string | null;
};

type Wallet = {
  id: string;
  balanceCents: number;
  updatedAt: string;
} | null;

type Props = {
  fullName: string | null;
  viewerAvatarUrl: string | null;
  linkedPatients: LinkedPatient[];
  mySponsors: MySponsor[];
  pendingConsents: PendingConsent[];
  upcomingAppointments: Appointment[];
  notifications: Notification[];
  wallet: Wallet;
  walletTransactions: WalletTransaction[];
  statusUpdates: StatusUpdate[];
  metrics: PatientMetric[];
  followUps: FollowUp[];
  patientId: string | null;
  viewerId: string | null;
};

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const AVATAR_COLORS = [
  { bg: "#E7E1F2", text: "#5b4a86" },
  { bg: "#D6E8F2", text: "#2b5e7d" },
  { bg: "#DCEFE3", text: "#13643F" },
  { bg: "#F2E1D6", text: "#7d4a2b" },
];

function Avatar({
  src,
  name,
  size = 26,
  bg = "#DCEFE3",
  color = "#13643F",
}: {
  src: string | null;
  name: string | null;
  size?: number;
  bg?: string;
  color?: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? ""}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size, flexShrink: 0 }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full text-[11px] font-bold"
      style={{ width: size, height: size, background: bg, color, flexShrink: 0 }}
    >
      {getInitials(name)}
    </div>
  );
}

export function UserHome({
  fullName,
  viewerAvatarUrl,
  linkedPatients,
  mySponsors,
  pendingConsents,
  upcomingAppointments,
  notifications,
  wallet,
  walletTransactions,
  statusUpdates,
  metrics,
  followUps,
  patientId,
  viewerId,
}: Props) {
  // -1 = viewing own dashboard; 0+ = linked patient index
  const [activePatientIdx, setActivePatientIdx] = useState(-1);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Wallet + status + metrics data for the currently viewed patient — refreshed on pill switch
  const [displayWallet, setDisplayWallet] = useState(wallet);
  const [displayWalletTxs, setDisplayWalletTxs] = useState<WalletTransaction[]>(walletTransactions);
  const [walletLoading, setWalletLoading] = useState(false);
  const [displayStatusUpdates, setDisplayStatusUpdates] = useState<StatusUpdate[]>(statusUpdates);
  const [statusLoading, setStatusLoading] = useState(false);
  const [displayMetrics, setDisplayMetrics] = useState<PatientMetric[]>(metrics);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [displayFollowUps, setDisplayFollowUps] = useState<FollowUp[]>(followUps ?? []);
  const [followUpsLoading, setFollowUpsLoading] = useState(false);
  const [sponsorsLoading, setSponsorsLoading] = useState(false);

  useEffect(() => {
    if (activePatientIdx === -1) {
      setDisplayWallet(wallet);
      setDisplayWalletTxs(walletTransactions);
      setDisplayStatusUpdates(statusUpdates);
      setDisplayMetrics(metrics);
      setDisplayFollowUps(followUps ?? []);
      return;
    }
    const patient = linkedPatients[activePatientIdx]?.patient;
    if (!patient?.id) return;
    setWalletLoading(true);
    setStatusLoading(true);
    setMetricsLoading(true);
    setFollowUpsLoading(true);
    setSponsorsLoading(true);
    Promise.all([
      fetchPatientWalletData(patient.id),
      fetchPatientStatusUpdates(patient.id),
      fetchPatientMetrics(patient.id),
      fetchPatientFollowUps(patient.id),
    ]).then(([walletData, statusData, metricsData, followUpsData]) => {
      setDisplayWallet(walletData.wallet);
      setDisplayWalletTxs(walletData.transactions);
      setWalletLoading(false);
      setDisplayStatusUpdates(statusData);
      setStatusLoading(false);
      setDisplayMetrics(metricsData);
      setMetricsLoading(false);
      setDisplayFollowUps(followUpsData ?? []);
      setFollowUpsLoading(false);
      setSponsorsLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePatientIdx]);

  const activePatient = linkedPatients[activePatientIdx] ?? null;
  const today = new Date();
  const monoStyle = { fontFamily: "var(--font-ibm-mono, 'IBM Plex Mono', monospace)" };
  const sansStyle = { fontFamily: "var(--font-hanken, 'Hanken Grotesk', sans-serif)" };

  const activePatientId = activePatientIdx === -1
    ? patientId
    : (linkedPatients[activePatientIdx]?.patient?.id ?? null);
  // For self: only show wallet column if viewer has one. For linked patient: always show (sponsors can top up).
  const hasWallet = activePatientId !== null && (activePatientIdx === -1 ? wallet !== null : true);
  const hasLinkedPatients = linkedPatients.length > 0;

  const gridCols = hasWallet ? "1fr 1.45fr 1fr" : "1fr 1.45fr";

  // Filter appointments to the active linked patient (matched by patient_name)
  const activePatientName = activePatient?.patient?.full_name ?? null;
  const visibleAppointments = hasLinkedPatients
    ? upcomingAppointments.filter((a) => a.patient_name === activePatientName)
    : upcomingAppointments;

  return (
    <div className="min-h-screen bg-[#F4F7F3]" style={sansStyle}>
      <UserNavbar fullName={fullName} notifications={notifications} />

      <div className="mx-auto max-w-[1440px] px-7 py-6">

        {/* Consent requests banner */}
        {pendingConsents.length > 0 && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
            <ConsentRequestCards requests={pendingConsents} />
          </div>
        )}

        {/* ── Care circle band ── */}
        <div className="mb-[18px] flex items-center justify-between rounded-2xl border border-[#E9EEE9] bg-white px-5 py-[18px]">
            <div className="flex items-center gap-4">
              <div>
                <div style={monoStyle} className="text-[10px] uppercase tracking-[.12em] text-[#8a988f]">
                  Your care circle
                </div>
                <div className="mt-0.5 text-[18px] font-bold text-[#16241D]">
                  {activePatientIdx === -1
                    ? `Viewing: You`
                    : `Viewing: ${activePatient?.patient?.full_name ?? "Patient"}`}
                </div>
              </div>

              <div className="mx-1 h-9 w-px bg-[#EBF0EB]" />

              <div className="flex flex-wrap items-center gap-2">
                {/* You pill */}
                <button
                  type="button"
                  onClick={() => setActivePatientIdx(-1)}
                  className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 transition-colors ${
                    activePatientIdx === -1
                      ? "border-[#15402C] bg-[#15402C]"
                      : "border-[#E6EBE6] bg-white hover:border-[#1F8A5B]/40 hover:bg-[#F4F7F3]"
                  }`}
                >
                  <Avatar src={viewerAvatarUrl} name={fullName} size={26} />
                  <span className={`text-[13px] ${activePatientIdx === -1 ? "font-semibold text-white" : "font-medium text-[#5a6a60]"}`}>
                    You
                  </span>
                  {activePatientIdx === -1 && (
                    <span className="h-[7px] w-[7px] rounded-full bg-[#F4C541]" />
                  )}
                </button>

                {/* Patient pills */}
                {linkedPatients.map((lp, i) => {
                  const isActive = i === activePatientIdx;
                  const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
                  return (
                    <button
                      key={lp.id}
                      type="button"
                      onClick={() => setActivePatientIdx(i)}
                      className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 transition-colors ${
                        isActive
                          ? "border-[#15402C] bg-[#15402C]"
                          : "border-[#E6EBE6] bg-white hover:border-[#1F8A5B]/40 hover:bg-[#F4F7F3]"
                      }`}
                    >
                      <Avatar
                        src={lp.patient?.avatar_url ?? null}
                        name={lp.patient?.full_name ?? null}
                        size={26}
                        bg={color.bg}
                        color={color.text}
                      />
                      <span
                        className={`text-[13px] ${isActive ? "font-semibold text-white" : "font-medium text-[#5a6a60]"}`}
                      >
                        {lp.patient?.full_name?.split(" ")[0] ?? "Patient"}
                      </span>
                      {isActive && (
                        <span className="h-[7px] w-[7px] rounded-full bg-[#F4C541]" />
                      )}
                    </button>
                  );
                })}

                {/* Support a patient pill */}
                <button
                  type="button"
                  onClick={() => setShowSupportModal(true)}
                  className="rounded-full border-[1.5px] border-dashed border-[#C9D6CC] px-3.5 py-2 text-[13px] font-semibold text-[#1F8A5B] transition-colors hover:border-[#1F8A5B] hover:bg-[#F4F7F3]"
                >
                  + Support a patient
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#FBF1CF] px-3 py-1.5 text-[11px] font-semibold text-[#9a7a06]">
                Needs review
              </span>
              <button className="rounded-[10px] bg-[#1F8A5B] px-4 py-2 text-[13.5px] font-semibold text-white">
                Message care team
              </button>
            </div>
          </div>

        {/* ── 3-col main grid ── */}
        <div className="gap-[18px]" style={{ display: "grid", gridTemplateColumns: gridCols }}>

          {/* LEFT — Appointments timeline */}
          <div className="rounded-2xl border border-[#E9EEE9] bg-white p-[22px]">
            <div className="mb-[18px] flex items-center justify-between">
              <span style={monoStyle} className="text-[11px] uppercase tracking-[.12em] text-[#8a988f]">
                Appointments
              </span>
              <Link href="/appointments/new" className="text-[12px] font-semibold text-[#1F8A5B]">
                + Book
              </Link>
            </div>

            {visibleAppointments.length === 0 ? (
              <div className="py-8 text-center text-[14px] text-[#94a298]">
                No upcoming appointments.
              </div>
            ) : (
              <div className="relative pl-[22px]">
                <div className="absolute bottom-1.5 left-[5px] top-1.5 w-0.5 bg-[#EAF0EB]" />

                {visibleAppointments.map((apt, i) => {
                  const date = new Date(apt.scheduled_at);
                  const msUntil = date.getTime() - today.getTime();
                  const daysUntil = Math.ceil(msUntil / 86400000);
                  const isSoon = daysUntil <= 3 && msUntil >= 0;
                  const isPast = msUntil < 0;

                  return (
                    <div
                      key={apt.id}
                      className={`relative ${i < visibleAppointments.length - 1 ? "mb-5" : ""}`}
                    >
                      {isPast ? (
                        <div
                          className="absolute left-[-22px] top-[3px] flex h-3 w-3 items-center justify-center rounded-full border-2 border-white text-[8px] font-extrabold text-[#1F8A5B]"
                          style={{ background: "#E4F1E9", boxShadow: "0 0 0 2px #DCEFE3" }}
                        >
                          ✓
                        </div>
                      ) : isSoon ? (
                        <div
                          className="absolute left-[-22px] top-[3px] h-3 w-3 rounded-full border-2 border-white bg-[#1F8A5B]"
                          style={{ boxShadow: "0 0 0 2px #C9E6D5" }}
                        />
                      ) : (
                        <div className="absolute left-[-22px] top-[3px] h-3 w-3 rounded-full border-2 border-[#CBD8CE] bg-white" />
                      )}

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[12px] font-bold ${
                            isSoon ? "text-[#1F8A5B]" : isPast ? "text-[#aab5ad]" : "text-[#7a8a80]"
                          }`}
                        >
                          {date
                            .toLocaleDateString("en-US", { month: "short", day: "numeric" })
                            .toUpperCase()}{" "}
                          ·{" "}
                          {isPast
                            ? "COMPLETED"
                            : date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </span>
                        {isSoon && (
                          <span className="rounded-full bg-[#F8E4A6] px-1.5 py-0.5 text-[9.5px] font-bold text-[#9a7a06]">
                            SOON
                          </span>
                        )}
                      </div>

                      <div
                        className={`mt-1 text-[14px] ${isPast ? "font-semibold text-[#7a8a80]" : "font-bold text-[#16241D]"}`}
                      >
                        {apt.patient_name
                          ? `Appt. for ${apt.patient_name}`
                          : apt.clinician_name
                          ? `Appt. with ${apt.clinician_name}`
                          : "Appointment"}
                      </div>

                      {apt.clinician_name && !isPast && (
                        <div className="mt-0.5 text-[12px] text-[#94a298]">{apt.clinician_name}</div>
                      )}
                      {isPast && (
                        <div className="mt-0.5 text-[12px] text-[#aab5ad]">
                          {apt.status === "completed" ? "Results available" : apt.status}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* CENTER — Latest vitals */}
          <div className="rounded-2xl border border-[#E9EEE9] bg-white p-[22px]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div style={monoStyle} className="text-[11px] uppercase tracking-[.12em] text-[#8a988f]">
                    Latest vitals · {activePatientIdx === -1 ? (fullName ?? "You") : (activePatient?.patient?.full_name ?? "Patient")}
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-[#94a298]">
                    Recorded by care team
                  </div>
                </div>
              </div>

              {metricsLoading ? (
                <SkeletonCard rows={4} />
              ) : displayMetrics.length === 0 ? (
                <div className="py-8 text-center text-[14px] text-[#94a298]">
                  No vitals recorded yet.
                </div>
              ) : (() => {
                const m = displayMetrics[0];
                const hasBP = m.blood_pressure_systolic !== null && m.blood_pressure_diastolic !== null;
                const adherenceColor: Record<string, string> = {
                  good: "text-[#1F8A5B]",
                  fair: "text-[#9a7a06]",
                  poor: "text-[#b94a2c]",
                };
                return (
                  <>
                    {/* Blood pressure — large tile */}
                    <div className="mb-3.5 flex items-center justify-between rounded-[13px] border border-[#F0EBD8] bg-[#FCFBF6] px-5 py-4">
                      <div>
                        <div style={monoStyle} className="text-[10px] uppercase tracking-[.1em] text-[#9a958a]">
                          Blood pressure
                        </div>
                        <div className="mt-1.5 text-[36px] font-extrabold leading-none tracking-[-0.03em] text-[#16241D]">
                          {hasBP ? `${m.blood_pressure_systolic}/${m.blood_pressure_diastolic}` : "—"}
                        </div>
                        <div className="mt-1 text-[12px] font-semibold text-[#9aa89f]">mmHg</div>
                      </div>
                      <div className="text-right">
                        <div style={monoStyle} className="text-[10px] text-[#c0c8c3]">Last recorded</div>
                        <div className="mt-0.5 text-[12px] font-semibold text-[#9aa89f]">
                          {new Date(m.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </div>
                      </div>
                    </div>

                    {/* Secondary metrics grid */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-[12px] border border-[#E2EEE6] bg-[#F6FAF7] p-3.5">
                        <div style={monoStyle} className="text-[10px] uppercase tracking-[.08em] text-[#8a988f]">
                          Weight
                        </div>
                        <div className="mt-1.5 text-[20px] font-extrabold text-[#16241D]">
                          {m.weight_kg !== null ? m.weight_kg.toFixed(1) : "—"}
                          <span className="ml-0.5 text-[11px] font-semibold text-[#9aa89f]"> kg</span>
                        </div>
                      </div>
                      <div className="rounded-[12px] border border-[#E2EEE6] bg-[#F6FAF7] p-3.5">
                        <div style={monoStyle} className="text-[10px] uppercase tracking-[.08em] text-[#8a988f]">
                          A1C
                        </div>
                        <div className="mt-1.5 text-[20px] font-extrabold text-[#16241D]">
                          {m.a1c !== null ? m.a1c.toFixed(1) : "—"}
                          <span className="ml-0.5 text-[11px] font-semibold text-[#9aa89f]"> %</span>
                        </div>
                      </div>
                      <div className="rounded-[12px] border border-[#E2EEE6] bg-[#F6FAF7] p-3.5">
                        <div style={monoStyle} className="text-[10px] uppercase tracking-[.08em] text-[#8a988f]">
                          Adherence
                        </div>
                        <div className={`mt-1.5 text-[16px] font-extrabold capitalize ${m.medication_adherence ? adherenceColor[m.medication_adherence] ?? "text-[#16241D]" : "text-[#9aa89f]"}`}>
                          {m.medication_adherence ?? "—"}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

          {/* RIGHT — Compact wallet */}
          {hasWallet && (
            <CompactWallet
              walletId={displayWallet?.id ?? ""}
              balanceCents={displayWallet?.balanceCents ?? 0}
              transactions={displayWalletTxs}
              patientId={activePatientId!}
              viewerId={viewerId}
              dataLoading={walletLoading}
            />
          )}
        </div>

        {/* ── Secondary sections ── */}

        <div className="mt-[18px] grid gap-[18px] lg:grid-cols-3">

          {/* Status updates */}
          <div className="rounded-2xl border border-[#E9EEE9] bg-white p-[22px]">
            <div style={monoStyle} className="mb-4 text-[11px] uppercase tracking-[.12em] text-[#8a988f]">
              Status updates
            </div>
            {statusLoading ? (
              <SkeletonCard rows={3} />
            ) : displayStatusUpdates.length === 0 ? (
              <p className="text-[13px] text-[#94a298]">No updates yet.</p>
            ) : (
              <ul className="space-y-3">
                {displayStatusUpdates.map((u) => (
                  <li key={u.id} className="rounded-xl border border-[#EEF2EE] bg-[#F6FAF7] px-4 py-3">
                    <span className="text-[11px] text-[#94a298]">
                      {new Date(u.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <p className="mt-1.5 whitespace-pre-wrap text-[14px] text-[#3f5247]">{u.statusText}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Your sponsors */}
          <div className="rounded-2xl border border-[#E9EEE9] bg-white p-[22px]">
            <div style={monoStyle} className="mb-4 text-[11px] uppercase tracking-[.12em] text-[#8a988f]">
              Your sponsors
            </div>
            {sponsorsLoading ? (
              <SkeletonCard rows={2} />
            ) : mySponsors.length === 0 ? (
              <p className="text-[13px] text-[#94a298]">No sponsors yet.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {mySponsors.map((link) => (
                  <li key={link.id} className="flex items-center gap-3 rounded-xl border border-[#EEF2EE] px-4 py-3">
                    <Avatar src={link.sponsor?.avatar_url ?? null} name={link.sponsor?.full_name ?? null} size={40} />
                    <div>
                      <div className="text-[14px] font-semibold text-[#16241D]">
                        {link.sponsor?.full_name ?? "Sponsor"}
                      </div>
                      {link.care_plan && (
                        <div className="text-[12px] text-[#94a298]">{link.care_plan.name}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Follow-ups */}
          <div className="rounded-2xl border border-[#E9EEE9] bg-white p-[22px]">
            <div style={monoStyle} className="mb-4 text-[11px] uppercase tracking-[.12em] text-[#8a988f]">
              Follow-ups
            </div>
            {followUpsLoading ? (
              <SkeletonCard rows={2} />
            ) : displayFollowUps.length === 0 ? (
              <p className="text-[13px] text-[#94a298]">No follow-ups yet.</p>
            ) : (
              <ul className="space-y-3">
                {displayFollowUps.map((f) => (
                  <li key={f.id} className="rounded-xl border border-[#EEF2EE] bg-[#F6FAF7] px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#94a298]">
                        Due {new Date(f.dueDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {f.overdue && (
                        <span className="text-[11px] font-semibold text-red-500">Overdue</span>
                      )}
                    </div>
                    {f.notes && (
                      <p className="mt-1.5 whitespace-pre-wrap text-[14px] text-[#3f5247]">{f.notes}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>

      </div>

      {/* ── Support-patient modal ── */}
      {showSupportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowSupportModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-[#E9EEE9] bg-white p-6 shadow-2xl"
            style={sansStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowSupportModal(false)}
              className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-[#9aa89f] transition hover:bg-[#F4F7F3] hover:text-[#5a6a60]"
            >
              ✕
            </button>

            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-[#E4F1E9]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1F8A5B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </div>

            <h2 className="mt-3 text-[18px] font-bold text-[#16241D]">Support a patient</h2>
            <p className="mt-1 text-[13.5px] text-[#6a7a70]">
              Invite a family member or loved one by email. Once they accept, you&apos;ll be able to view their care details and contribute to their wallet.
            </p>

            <div className="mt-5">
              <SupportPatientForm />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
