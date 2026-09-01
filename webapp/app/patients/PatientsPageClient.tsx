"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { UserNavbar } from "../home/UserNavbar";
import { EndSponsorshipButton } from "../home/EndSponsorshipButton";
import { CompactWallet } from "../home/CompactWallet";
import { VitalsPanel } from "./VitalsPanel";
import { PatientTimelineTabs } from "./PatientTimelineTabs";
import { fetchSponsoredPatientDetail, fetchSelfPatientDetail, type SponsoredPatientDetail } from "./actions";

const SELF = "self";

type LinkedPatient = {
  id: string;
  started_at: string;
  care_plan: { id: string; name: string; slug: string; price_cents: number } | null;
  patient: { id: string; full_name: string | null; age: number | null; avatar_url: string | null } | null;
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

type Props = {
  fullName: string | null;
  viewerAvatarUrl: string | null;
  notifications: Notification[];
  linkedPatients: LinkedPatient[];
  viewerId: string;
  initialLinkId: string;
  initialDetail: SponsoredPatientDetail;
};

const AVATAR_COLORS = [
  { bg: "#E7E1F2", text: "#5b4a86" },
  { bg: "#D6E8F2", text: "#2b5e7d" },
  { bg: "#DCEFE3", text: "#13643F" },
  { bg: "#F2E1D6", text: "#7d4a2b" },
];

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const monoStyle = { fontFamily: "var(--font-ibm-mono, 'IBM Plex Mono', monospace)" };
const sansStyle = { fontFamily: "var(--font-hanken, 'Hanken Grotesk', sans-serif)" };

export function PatientsPageClient({
  fullName,
  viewerAvatarUrl,
  notifications,
  linkedPatients,
  viewerId,
  initialLinkId,
  initialDetail,
}: Props) {
  const [selectedLinkId, setSelectedLinkId] = useState(initialLinkId);
  const [detail, setDetail] = useState(initialDetail);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<Record<string, SponsoredPatientDetail>>({ [initialLinkId]: initialDetail });

  useEffect(() => {
    const cached = cacheRef.current[selectedLinkId];
    if (cached) {
      setDetail(cached);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const fetchDetail = selectedLinkId === SELF ? fetchSelfPatientDetail() : fetchSponsoredPatientDetail(selectedLinkId);
    fetchDetail.then((d) => {
      if (cancelled) return;
      cacheRef.current[selectedLinkId] = d;
      setDetail(d);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedLinkId]);

  const {
    link,
    patient,
    carePlan,
    metrics,
    appointments,
    careSummary,
    statusUpdates,
    followUps,
    wallet,
    transactions,
    conditions,
  } = detail;

  const isSelf = selectedLinkId === SELF;
  const now = new Date();
  const patientName = patient?.full_name ?? (isSelf ? "You" : "Patient");
  const patientAvatar = patient?.avatar_url ?? null;
  const patientAge =
    patient?.date_of_birth != null
      ? Math.floor((now.getTime() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;
  const startedDate = link
    ? new Date(link.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;
  const latestMetric = metrics[0] ?? null;

  return (
    <div className="min-h-screen bg-[#F4F7F3]" style={sansStyle}>
      <UserNavbar fullName={fullName} notifications={notifications} activePath="/patients" />

      <div className="mx-auto max-w-[1200px] px-7 py-6">
        {/* Care circle band */}
        <div className="rounded-2xl border border-[#E9EEE9] bg-white px-5 py-[18px]">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <div style={monoStyle} className="text-[10px] uppercase tracking-[.14em] text-[#8a988f]">
                Your care circle
              </div>
              <div className="mt-1 text-[17px] font-semibold text-[#16241D]">
                Viewing: {isSelf ? "You" : patientName.split(" ")[0]}
              </div>
            </div>
            <div className="mx-1 h-9 w-px self-stretch bg-[#EBF0EB]" />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedLinkId(SELF)}
                className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 transition-colors ${
                  isSelf
                    ? "border-[#15402C] bg-[#15402C]"
                    : "border-[#E6EBE6] bg-white hover:border-[#1F8A5B]/40 hover:bg-[#F4F7F3]"
                }`}
              >
                {viewerAvatarUrl ? (
                  <img src={viewerAvatarUrl} alt="" className="h-[26px] w-[26px] rounded-full object-cover" />
                ) : (
                  <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#DCEFE3] text-[11px] font-bold text-[#13643F]">
                    {getInitials(fullName)}
                  </div>
                )}
                <span className={`text-[13px] ${isSelf ? "font-semibold text-white" : "font-medium text-[#5a6a60]"}`}>
                  You
                </span>
                {isSelf && <span className="h-[7px] w-[7px] rounded-full bg-[#F4C541]" />}
              </button>
              {linkedPatients.map((lp, i) => {
                const isActive = lp.id === selectedLinkId;
                const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
                return (
                  <button
                    key={lp.id}
                    type="button"
                    onClick={() => setSelectedLinkId(lp.id)}
                    className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 transition-colors ${
                      isActive
                        ? "border-[#15402C] bg-[#15402C]"
                        : "border-[#E6EBE6] bg-white hover:border-[#1F8A5B]/40 hover:bg-[#F4F7F3]"
                    }`}
                  >
                    {lp.patient?.avatar_url ? (
                      <img src={lp.patient.avatar_url} alt="" className="h-[26px] w-[26px] rounded-full object-cover" />
                    ) : (
                      <div
                        className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-[11px] font-bold"
                        style={{ background: color.bg, color: color.text }}
                      >
                        {getInitials(lp.patient?.full_name ?? null)}
                      </div>
                    )}
                    <span className={`text-[13px] ${isActive ? "font-semibold text-white" : "font-medium text-[#5a6a60]"}`}>
                      {lp.patient?.full_name?.split(" ")[0] ?? "Patient"}
                    </span>
                    {isActive && <span className="h-[7px] w-[7px] rounded-full bg-[#F4C541]" />}
                  </button>
                );
              })}
              <Link
                href="/home"
                className="rounded-full border-[1.5px] border-dashed border-[#C9D6CC] px-3.5 py-2 text-[13px] font-semibold text-[#1F8A5B] transition-colors hover:border-[#1F8A5B] hover:bg-[#F4F7F3]"
              >
                + Support a patient
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <DetailSkeleton />
        ) : (
          <>
            {/* Patient header */}
            <div className="mt-4 rounded-2xl border border-[#E9EEE9] bg-white p-[22px]">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                {patientAvatar ? (
                  <img src={patientAvatar} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#E7F0E9] text-[20px] font-bold text-[#0f5132]">
                    {getInitials(patientName)}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-[22px] font-bold text-[#16241D]">{patientName}</h1>
                    {patientAge != null && (
                      <span className="rounded-full bg-[#F4F7F3] px-2.5 py-1 text-[12px] font-semibold text-[#6a7a70]">
                        {patientAge}y
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 text-[13px] text-[#94a298]">
                    {isSelf
                      ? "Your own health record"
                      : `${carePlan?.name ?? "Care plan"}${startedDate ? ` · Sponsored since ${startedDate}` : ""}`}
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    {conditions.length > 0 ? (
                      conditions.map((c) => (
                        <span
                          key={c.id}
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                            c.type === "allergy"
                              ? "bg-[#FCEFE1] text-[#8a5a1f]"
                              : "bg-[#F4F7F3] text-[#5a6a60]"
                          }`}
                        >
                          {c.label}
                          {c.severity ? ` · ${c.severity}` : ""}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full border border-dashed border-[#DCE4DD] px-2.5 py-1 text-[11px] font-medium text-[#9aa89f]">
                        No conditions or allergies recorded
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-8 border-t border-[#EEF2EE] pt-4 sm:border-t-0 sm:border-l sm:pl-6 sm:pt-0">
                  <div>
                    <div style={monoStyle} className="text-[10px] uppercase tracking-[.14em] text-[#8a988f]">
                      Next visit
                    </div>
                    {careSummary?.nextAppointmentDate ? (
                      <>
                        <div className="mt-1.5 text-[14px] font-semibold text-[#16241D]">
                          {new Date(careSummary.nextAppointmentDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-[12px] text-[#94a298]">
                          {new Date(careSummary.nextAppointmentDate).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="mt-1.5 text-[14px] font-semibold text-[#c7cfc8]">None scheduled</div>
                    )}
                  </div>
                  <div>
                    <div style={monoStyle} className="text-[10px] uppercase tracking-[.14em] text-[#8a988f]">
                      Last reading
                    </div>
                    {latestMetric ? (
                      <>
                        <div className="mt-1.5 text-[14px] font-semibold text-[#16241D]">
                          {timeAgo(latestMetric.recorded_at)}
                        </div>
                        <div className="text-[12px] text-[#94a298]">
                          {new Date(latestMetric.recorded_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="mt-1.5 text-[14px] font-semibold text-[#c7cfc8]">No readings yet</div>
                    )}
                  </div>
                </div>
              </div>
              {link && (
                <div className="mt-4 flex justify-end border-t border-[#EEF2EE] pt-4">
                  <EndSponsorshipButton planId={link.id} label="Cancel sponsorship" />
                </div>
              )}
            </div>

            {/* Vitals + Labs / Medications + Wallet */}
            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px] lg:items-start">
              <div className="flex flex-col gap-4">
                {/* Vitals panel: range/legend controls, stat tiles, BP trend chart */}
                <VitalsPanel metrics={metrics} />

                <div className="rounded-2xl border border-[#E9EEE9] bg-white p-[22px]">
                  <div className="flex items-center justify-between">
                    <span style={monoStyle} className="text-[10px] uppercase tracking-[.14em] text-[#8a988f]">
                      Labs
                    </span>
                    {latestMetric && (
                      <span className="text-[11px] text-[#94a298]">
                        Drawn{" "}
                        {new Date(latestMetric.recorded_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 grid gap-6 sm:grid-cols-3">
                    <div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[12.5px] font-medium text-[#3d4a43]">HbA1c</span>
                        <span className="text-[16px] font-bold text-[#16241D]">
                          {latestMetric?.a1c != null ? `${latestMetric.a1c}%` : "—"}
                        </span>
                      </div>
                      {latestMetric?.a1c != null && (
                        <div className="mt-2 h-1.5 rounded-full bg-[#eceae4]">
                          <div
                            className="h-full rounded-full bg-[#E3B341]"
                            style={{ width: `${Math.min(100, Math.max(4, ((latestMetric.a1c - 4) / 8) * 100))}%` }}
                          />
                        </div>
                      )}
                      <div className="mt-1.5 text-[11px] text-[#94a298]">Target below 6.5%</div>
                    </div>
                    <div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[12.5px] font-medium text-[#3d4a43]">LDL</span>
                        <span className="text-[13px] font-medium text-[#c7cfc8]">Not tracked</span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-[#F0F4F0]" />
                      <div className="mt-1.5 text-[11px] text-[#c7cfc8]">No lab panel data recorded yet</div>
                    </div>
                    <div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[12.5px] font-medium text-[#3d4a43]">HDL</span>
                        <span className="text-[13px] font-medium text-[#c7cfc8]">Not tracked</span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-[#F0F4F0]" />
                      <div className="mt-1.5 text-[11px] text-[#c7cfc8]">No lab panel data recorded yet</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="rounded-2xl border border-[#E9EEE9] bg-white p-[22px]">
                  <span style={monoStyle} className="text-[10px] uppercase tracking-[.14em] text-[#8a988f]">
                    Medications
                  </span>
                  <div className="mt-6 py-4 text-center text-[13px] text-[#94a298]">
                    Medications aren&apos;t tracked yet.
                  </div>
                </div>
                {wallet && patient?.id && (
                  <CompactWallet
                    walletId={wallet.id}
                    balanceCents={wallet.balanceCents}
                    transactions={transactions}
                    patientId={patient.id}
                    viewerId={viewerId}
                  />
                )}
              </div>
            </div>

            {/* Timeline / tabs */}
            <div className="mt-4">
              <PatientTimelineTabs
                appointments={appointments}
                statusUpdates={statusUpdates}
                followUps={followUps}
                metrics={metrics}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="mt-4 animate-pulse space-y-4">
      <div className="rounded-2xl border border-[#E9EEE9] bg-white p-[22px]">
        <div className="flex items-start gap-5">
          <div className="h-16 w-16 shrink-0 rounded-2xl bg-[#E9EEE9]" />
          <div className="flex-1 space-y-2.5">
            <div className="h-5 w-48 rounded-full bg-[#E0E6E0]" />
            <div className="h-3 w-64 rounded-full bg-[#EEF2EE]" />
          </div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="flex flex-col gap-4">
          <div className="h-14 rounded-2xl border border-[#E9EEE9] bg-white" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[110px] rounded-[14px] bg-[#F0F4F0]" />
            ))}
          </div>
          <div className="h-[260px] rounded-2xl border border-[#E9EEE9] bg-white p-[22px]">
            <div className="h-full w-full rounded-xl bg-[#F0F4F0]" />
          </div>
          <div className="h-40 rounded-2xl border border-[#E9EEE9] bg-white" />
        </div>
        <div className="flex flex-col gap-4">
          <div className="h-24 rounded-2xl border border-[#E9EEE9] bg-white" />
          <div className="h-56 rounded-2xl border border-[#E9EEE9] bg-white" />
        </div>
      </div>
      <div className="h-72 rounded-2xl border border-[#E9EEE9] bg-white" />
    </div>
  );
}
