"use client";

import Link from "next/link";

export type CareContinuityPatient = {
  patientId: string;
  patientName: string;
  patientAvatar: string | null;
  lastAppointmentDate: string | null;
  daysSinceLastAppointment: number | null;
  openFollowUpsCount: number;
  overdueFollowUpsCount: number;
};

type Props = { patients: CareContinuityPatient[] };

function UserIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

export function CareContinuityPanel({ patients }: Props) {
  const patientsNeedingAttention = patients
    .filter(
      (p) =>
        (p.daysSinceLastAppointment !== null && p.daysSinceLastAppointment >= 30) ||
        p.daysSinceLastAppointment === null ||
        p.overdueFollowUpsCount > 0,
    )
    .sort((a, b) => {
      if (a.overdueFollowUpsCount !== b.overdueFollowUpsCount)
        return b.overdueFollowUpsCount - a.overdueFollowUpsCount;
      const aDays = a.daysSinceLastAppointment ?? Infinity;
      const bDays = b.daysSinceLastAppointment ?? Infinity;
      return bDays - aDays;
    });

  return (
    <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Care continuity</h2>
          <p className="text-sm text-slate-500">Patients not seen in 30+ days or with overdue follow-ups</p>
        </div>
        <span className="text-sm text-slate-500">
          {patientsNeedingAttention.length} flagged
        </span>
      </div>

      {patientsNeedingAttention.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-900">No care gaps detected</p>
          <p className="mt-1 text-xs text-slate-500">All patients seen within 30 days with no overdue follow-ups</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {patientsNeedingAttention.map((p) => (
            <li
              key={p.patientId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                  {p.patientAvatar ? (
                    <img src={p.patientAvatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-slate-900">{p.patientName}</span>
                    {p.overdueFollowUpsCount > 0 && (
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20">
                        {p.overdueFollowUpsCount} overdue
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {p.daysSinceLastAppointment === null
                      ? "Never seen"
                      : `Last seen ${p.daysSinceLastAppointment} day${p.daysSinceLastAppointment === 1 ? "" : "s"} ago`}
                    {p.openFollowUpsCount > 0
                      ? ` · ${p.openFollowUpsCount} open follow-up${p.openFollowUpsCount === 1 ? "" : "s"}`
                      : ""}
                  </p>
                </div>
              </div>
              <Link
                href={`/clinician-portal/appointments?patient=${p.patientId}`}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                View appointments
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
