"use client";

import { useMemo, useState } from "react";
import type { PatientMetric, FollowUp } from "@/app/home/actions";
import type { StatusUpdate } from "@/app/clinician-portal/status-update-types";

export type TimelineAppointment = {
  id: string;
  scheduled_at: string;
  status: string;
  clinician_id: string;
  clinician_name: string | null;
  clinician_avatar_url: string | null;
};

type Props = {
  appointments: TimelineAppointment[];
  statusUpdates: StatusUpdate[];
  followUps: FollowUp[];
  metrics: PatientMetric[];
};

const TABS = ["Timeline", "Vitals log", "Status updates", "Medications", "Care notes", "Billing"] as const;
type Tab = (typeof TABS)[number];
const PLACEHOLDER_TABS: Tab[] = ["Medications", "Care notes", "Billing"];

const monoStyle = { fontFamily: "var(--font-ibm-mono, 'IBM Plex Mono', monospace)" };

type TimelineEntry = {
  id: string;
  date: string;
  dotColor: string;
  title: string;
  detail: string;
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase();
}

export function PatientTimelineTabs({ appointments, statusUpdates, followUps, metrics }: Props) {
  const [tab, setTab] = useState<Tab>("Timeline");

  const timeline = useMemo<TimelineEntry[]>(() => {
    const entries: TimelineEntry[] = [];
    for (const apt of appointments) {
      entries.push({
        id: `apt-${apt.id}`,
        date: apt.scheduled_at,
        dotColor: apt.status === "completed" ? "#157347" : apt.status === "cancelled" ? "#C0705A" : "#8FA8B8",
        title: apt.status === "scheduled" ? "Appointment scheduled" : apt.status === "completed" ? "Visit completed" : "Appointment " + apt.status.replace("_", " "),
        detail: apt.clinician_name ? `With ${apt.clinician_name}` : "Care team visit",
      });
    }
    for (const su of statusUpdates) {
      entries.push({
        id: `su-${su.id}`,
        date: su.createdAt,
        dotColor: "#E3B341",
        title: "Status update",
        detail: `“${su.statusText}”`,
      });
    }
    for (const fu of followUps) {
      entries.push({
        id: `fu-${fu.id}`,
        date: fu.dueDate,
        dotColor: fu.overdue ? "#C0705A" : fu.status === "completed" ? "#157347" : "#8FA8B8",
        title: fu.status === "completed" ? "Follow-up completed" : fu.overdue ? "Follow-up overdue" : "Follow-up due",
        detail: fu.notes ?? "Care team follow-up task",
      });
    }
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [appointments, statusUpdates, followUps]);

  return (
    <div className="rounded-2xl border border-[#E9EEE9] bg-white">
      <div className="flex items-center gap-1 overflow-x-auto border-b border-[#E9EEE9] px-4 pt-3">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`shrink-0 border-b-2 px-3.5 py-2.5 text-[12.5px] font-semibold transition ${
              tab === t ? "border-[#1F8A5B] text-[#0f5132]" : "border-transparent text-[#7a8a80] hover:text-[#16241D]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-[22px]">
        {tab === "Timeline" &&
          (timeline.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-[#94a298]">No timeline activity yet.</div>
          ) : (
            <div className="relative pl-[22px]">
              <div className="absolute bottom-1.5 left-[5px] top-1.5 w-0.5 bg-[#EAF0EB]" />
              <div className="space-y-5">
                {timeline.map((entry) => (
                  <div key={entry.id} className="relative">
                    <span
                      className="absolute -left-[22px] top-1 h-[10px] w-[10px] rounded-full"
                      style={{ background: entry.dotColor }}
                    />
                    <div style={monoStyle} className="text-[10.5px] text-[#9aa8a0]">
                      {fmtDate(entry.date)}
                    </div>
                    <div className="mt-1 text-[13.5px] font-semibold text-[#16241D]">{entry.title}</div>
                    <div className="mt-0.5 text-[12px] leading-relaxed text-[#7a8a80]">{entry.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}

        {tab === "Vitals log" &&
          (metrics.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-[#94a298]">No vitals recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-[12.5px]">
                <thead>
                  <tr style={monoStyle} className="border-b border-[#EEF2EE] text-[10px] uppercase tracking-[.1em] text-[#9aa8a0]">
                    <th className="pb-2 pr-3 font-semibold">When</th>
                    <th className="pb-2 pr-3 font-semibold">BP</th>
                    <th className="pb-2 pr-3 font-semibold">Weight</th>
                    <th className="pb-2 font-semibold">A1c</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((m) => (
                    <tr key={m.id} className="border-b border-[#F4F7F3] text-[#3d4a43]">
                      <td className="py-2.5 pr-3">
                        {new Date(m.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </td>
                      <td className="py-2.5 pr-3 font-semibold text-[#16241D]">
                        {m.blood_pressure_systolic != null && m.blood_pressure_diastolic != null
                          ? `${m.blood_pressure_systolic}/${m.blood_pressure_diastolic}`
                          : "—"}
                      </td>
                      <td className="py-2.5 pr-3">{m.weight_kg != null ? `${m.weight_kg} kg` : "—"}</td>
                      <td className="py-2.5">{m.a1c != null ? `${m.a1c}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {tab === "Status updates" &&
          (statusUpdates.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-[#94a298]">No status updates yet.</div>
          ) : (
            <ul className="space-y-3">
              {statusUpdates.map((u) => (
                <li key={u.id} className="rounded-xl bg-[#F4F7F3] px-4 py-3">
                  <span style={monoStyle} className="text-[10.5px] text-[#9aa8a0]">
                    {fmtDate(u.createdAt)}
                  </span>
                  <p className="mt-1.5 whitespace-pre-wrap text-[13px] text-[#3d4a43]">{u.statusText}</p>
                </li>
              ))}
            </ul>
          ))}

        {PLACEHOLDER_TABS.includes(tab) && (
          <div className="py-8 text-center text-[13px] text-[#94a298]">
            {tab} isn&apos;t tracked yet.
          </div>
        )}
      </div>
    </div>
  );
}
