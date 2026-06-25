import Link from "next/link";
import { ConsentRequestCards } from "./ConsentRequestCards";
import { UserNavbar } from "./UserNavbar";
import { CompactWallet } from "./CompactWallet";
import type { WalletTransaction } from "./WalletCard";
import type { StatusUpdate } from "@/app/clinician-portal/status-update-types";

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
  linkedPatients: LinkedPatient[];
  mySponsors: MySponsor[];
  pendingConsents: PendingConsent[];
  upcomingAppointments: Appointment[];
  notifications: Notification[];
  wallet: Wallet;
  walletTransactions: WalletTransaction[];
  statusUpdates: StatusUpdate[];
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

export function UserHome({
  fullName,
  linkedPatients,
  mySponsors,
  pendingConsents,
  upcomingAppointments,
  notifications,
  wallet,
  walletTransactions,
  statusUpdates,
  patientId,
  viewerId,
}: Props) {
  const activePatient = linkedPatients[0] ?? null;
  const userInitials = getInitials(fullName);
  const today = new Date();
  const monoStyle = { fontFamily: "var(--font-ibm-mono, 'IBM Plex Mono', monospace)" };
  const sansStyle = { fontFamily: "var(--font-hanken, 'Hanken Grotesk', sans-serif)" };

  const hasWallet = wallet !== null && patientId !== null;
  const hasLinkedPatients = linkedPatients.length > 0;

  // Grid: appointments | vitals | wallet  (3-col)
  // If no linked patients → drop vitals center column (2-col)
  // If no wallet → drop wallet right column
  const gridCols =
    hasLinkedPatients && hasWallet
      ? "1fr 1.45fr 1fr"
      : hasLinkedPatients || hasWallet
      ? "1fr 1fr"
      : "1fr";

  return (
    <div className="min-h-screen bg-[#F4F7F3]" style={sansStyle}>
      {/* Navbar */}
      <UserNavbar fullName={fullName} notifications={notifications} />

      {/* Body */}
      <div className="mx-auto max-w-[1440px] px-7 py-6">

        {/* Consent requests banner */}
        {pendingConsents.length > 0 && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
            <ConsentRequestCards requests={pendingConsents} />
          </div>
        )}

        {/* ── Care circle band ── */}
        {hasLinkedPatients && (
          <div className="mb-[18px] flex items-center justify-between rounded-2xl border border-[#E9EEE9] bg-white px-5 py-[18px]">
            <div className="flex items-center gap-4">
              <div>
                <div style={monoStyle} className="text-[10px] uppercase tracking-[.12em] text-[#8a988f]">
                  Your care circle
                </div>
                <div className="mt-0.5 text-[18px] font-bold text-[#16241D]">
                  {activePatient
                    ? `Viewing: ${activePatient.patient?.full_name ?? "Patient"}`
                    : `Welcome, ${fullName ?? "you"}`}
                </div>
              </div>

              <div className="mx-1 h-9 w-px bg-[#EBF0EB]" />

              {/* Pill switcher */}
              <div className="flex flex-wrap items-center gap-2">
                {/* You pill */}
                <div className="flex items-center gap-2 rounded-full border border-[#E6EBE6] px-3 py-2">
                  <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#DCEFE3] text-[11px] font-bold text-[#13643F]">
                    {userInitials}
                  </div>
                  <span className="text-[13px] font-medium text-[#5a6a60]">You</span>
                </div>

                {linkedPatients.map((lp, i) => {
                  const isActive = i === 0;
                  const initials = getInitials(lp.patient?.full_name ?? null);
                  const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
                  return (
                    <div
                      key={lp.id}
                      className={`flex items-center gap-2 rounded-full border px-3 py-2 ${
                        isActive
                          ? "border-[#15402C] bg-[#15402C]"
                          : "border-[#E6EBE6] bg-white"
                      }`}
                    >
                      <div
                        className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-[11px] font-bold"
                        style={{ background: color.bg, color: color.text }}
                      >
                        {initials}
                      </div>
                      <span
                        className={`text-[13px] font-${isActive ? "semibold" : "medium"} ${
                          isActive ? "text-white" : "text-[#5a6a60]"
                        }`}
                      >
                        {lp.patient?.full_name?.split(" ")[0] ?? "Patient"}
                      </span>
                      {isActive && (
                        <span className="h-[7px] w-[7px] rounded-full bg-[#F4C541]" />
                      )}
                    </div>
                  );
                })}

                <SupportPatientPill />
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
        )}

        {/* ── 3-col main grid ── */}
        <div
          className="gap-[18px]"
          style={{ display: "grid", gridTemplateColumns: gridCols }}
        >

          {/* LEFT — Appointments timeline */}
          <div className="rounded-2xl border border-[#E9EEE9] bg-white p-[22px]">
            <div className="mb-[18px] flex items-center justify-between">
              <span style={monoStyle} className="text-[11px] uppercase tracking-[.12em] text-[#8a988f]">
                Appointments
              </span>
              <Link
                href="/appointments/new"
                className="text-[12px] font-semibold text-[#1F8A5B]"
              >
                + Book
              </Link>
            </div>

            {upcomingAppointments.length === 0 ? (
              <div className="py-8 text-center text-[14px] text-[#94a298]">
                No upcoming appointments.
              </div>
            ) : (
              <div className="relative pl-[22px]">
                {/* Timeline line */}
                <div className="absolute bottom-1.5 left-[5px] top-1.5 w-0.5 bg-[#EAF0EB]" />

                {upcomingAppointments.map((apt, i) => {
                  const date = new Date(apt.scheduled_at);
                  const msUntil = date.getTime() - today.getTime();
                  const daysUntil = Math.ceil(msUntil / 86400000);
                  const isSoon = daysUntil <= 3 && msUntil >= 0;
                  const isPast = msUntil < 0;

                  return (
                    <div
                      key={apt.id}
                      className={`relative ${i < upcomingAppointments.length - 1 ? "mb-5" : ""}`}
                    >
                      {/* Timeline node */}
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

                      {/* Date + soon badge */}
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
                            : date.toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                        </span>
                        {isSoon && (
                          <span className="rounded-full bg-[#F8E4A6] px-1.5 py-0.5 text-[9.5px] font-bold text-[#9a7a06]">
                            SOON
                          </span>
                        )}
                      </div>

                      {/* Appointment title */}
                      <div
                        className={`mt-1 text-[14px] font-${isPast ? "semibold" : "bold"} ${
                          isPast ? "text-[#7a8a80]" : "text-[#16241D]"
                        }`}
                      >
                        {apt.patient_name
                          ? `Appt. for ${apt.patient_name}`
                          : apt.clinician_name
                          ? `Appt. with ${apt.clinician_name}`
                          : "Appointment"}
                      </div>

                      {/* Clinician + status */}
                      {apt.clinician_name && !isPast && (
                        <div className="mt-0.5 text-[12px] text-[#94a298]">
                          {apt.clinician_name}
                        </div>
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

          {/* CENTER — Vitals focus (only when linked patients) */}
          {hasLinkedPatients && (
            <div className="rounded-2xl border border-[#E9EEE9] bg-white p-[22px]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div style={monoStyle} className="text-[11px] uppercase tracking-[.12em] text-[#8a988f]">
                    Live vitals · {activePatient?.patient?.full_name ?? "Patient"}
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-[#94a298]">
                    Connect a device to view real-time vitals
                  </div>
                </div>
                <button className="rounded-[9px] bg-[#1F8A5B] px-3 py-1.5 text-[12px] font-semibold text-white">
                  Full report
                </button>
              </div>

              {/* Hero vital + chart */}
              <div className="mb-3.5 flex items-stretch gap-4">
                {/* Heart rate card */}
                <div className="flex w-[150px] shrink-0 flex-col justify-center rounded-[13px] border border-[#F0EBD8] bg-[#FCFBF6] p-4">
                  <div style={monoStyle} className="text-[10px] uppercase tracking-[.1em] text-[#9a958a]">
                    Heart rate
                  </div>
                  <div className="mt-2 text-[40px] font-extrabold leading-none tracking-[-0.03em] text-[#16241D]">
                    —
                  </div>
                  <div className="text-[12px] font-semibold text-[#9aa89f]">bpm</div>
                  <div className="mt-2 text-[11.5px] font-bold text-[#9aa89f]">No device linked</div>
                </div>

                {/* 24h trend placeholder */}
                <div className="flex flex-1 flex-col items-center justify-center rounded-[13px] border border-[#EAF0EB] bg-[#F8FBF9] p-4 text-center">
                  <div style={monoStyle} className="mb-2 text-[10px] uppercase tracking-[.08em] text-[#9aa89f]">
                    Heart-rate trend · 24h
                  </div>
                  <div className="flex items-end gap-1.5" style={{ height: 70 }}>
                    {[38, 52, 44, 66, 58, 80, 72, 50, 62, 46].map((h, i) => (
                      <div
                        key={i}
                        className="w-[9px] rounded-[3px] bg-[#D0DDD5]"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-[#9aa89f]">Link wearable to populate</p>
                </div>
              </div>

              {/* Secondary vitals grid */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Blood pressure", value: "—", unit: "mmHg", status: "—", ok: true },
                  { label: "Blood oxygen", value: "—", unit: "%", status: "—", ok: true },
                  { label: "Glucose", value: "—", unit: "mg/dL", status: "—", ok: true },
                ].map(({ label, value, unit, status, ok }) => (
                  <div
                    key={label}
                    className={`rounded-[12px] border p-3.5 ${
                      ok ? "border-[#E2EEE6] bg-[#F6FAF7]" : "border-[#F0EBD8] bg-[#FCFBF6]"
                    }`}
                  >
                    <div style={monoStyle} className="text-[10px] uppercase tracking-[.08em] text-[#8a988f]">
                      {label}
                    </div>
                    <div className="mt-1.5 text-[20px] font-extrabold text-[#16241D]">
                      {value}
                      <span className="ml-0.5 text-[11px] font-semibold text-[#9aa89f]"> {unit}</span>
                    </div>
                    <div className={`mt-0.5 text-[11px] font-semibold ${ok ? "text-[#9aa89f]" : "text-[#B68410]"}`}>
                      {status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RIGHT — Compact wallet */}
          {hasWallet && (
            <CompactWallet
              walletId={wallet!.id}
              balanceCents={wallet!.balanceCents}
              transactions={walletTransactions}
              patientId={patientId!}
              viewerId={viewerId}
            />
          )}
        </div>

        {/* ── Secondary sections ── */}

        {/* Status updates (if any) */}
        {statusUpdates.length > 0 && (
          <div className="mt-[18px] rounded-2xl border border-[#E9EEE9] bg-white p-[22px]">
            <div style={monoStyle} className="mb-4 text-[11px] uppercase tracking-[.12em] text-[#8a988f]">
              Status updates
            </div>
            <ul className="space-y-3">
              {statusUpdates.map((u) => (
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
          </div>
        )}

        {/* Sponsors (if patient has sponsors) */}
        {mySponsors.length > 0 && (
          <div className="mt-[18px] rounded-2xl border border-[#E9EEE9] bg-white p-[22px]">
            <div style={monoStyle} className="mb-4 text-[11px] uppercase tracking-[.12em] text-[#8a988f]">
              Your sponsors
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {mySponsors.map((link) => (
                <li
                  key={link.id}
                  className="flex items-center gap-3 rounded-xl border border-[#EEF2EE] px-4 py-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DCEFE3] text-[14px] font-bold text-[#13643F]">
                    {getInitials(link.sponsor?.full_name ?? null)}
                  </div>
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
          </div>
        )}

      </div>
    </div>
  );
}

function SupportPatientPill() {
  return (
    <div className="rounded-full border-[1.5px] border-dashed border-[#C9D6CC] px-3.5 py-2 text-[13px] font-semibold text-[#1F8A5B]">
      + Support a patient
    </div>
  );
}
