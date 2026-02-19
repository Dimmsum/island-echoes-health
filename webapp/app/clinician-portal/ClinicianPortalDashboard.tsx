"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

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
};

const CalendarIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const UsersIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const ClockIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const UserIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

export function ClinicianPortalDashboard({
  fullName,
  avatarUrl,
  role,
  patientsWithPlans,
  stats,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  const greeting = fullName ? `Welcome back, ${fullName}` : "Welcome back";
  const roleLabel = role === "clinician" ? "Clinician" : "Admin";

  const filteredPatients = patientsWithPlans.filter((p) =>
    p.patient_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Enhanced background with subtle patterns */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-[#E6E15A]/20 blur-3xl" />
        <div className="absolute right-[-10rem] bottom-[-10rem] h-[32rem] w-[48rem] rounded-full bg-[#9CCB4A]/15 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1F5F2E]/5 blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/clinician-portal" className="flex items-center gap-3">
              <Image
                src="/island-echoes-health.svg"
                alt="Island Echoes Health"
                width={140}
                height={50}
                priority
                className="h-10 w-auto"
              />
            </Link>
            <div className="hidden h-8 w-px bg-slate-300 sm:block" />
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100">
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-200 bg-slate-100">
                  <UserIcon />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-900">{fullName ?? "Clinician"}</p>
                <p className="text-xs text-slate-500">{roleLabel}</p>
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <Link
              href="/clinician-portal/appointments"
              className="rounded-lg px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Appointments
            </Link>
            {role === "admin" && (
              <Link
                href="/admin"
                className="rounded-lg px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Admin
              </Link>
            )}
            <Link
              href="/home/profile"
              className="rounded-lg px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Profile
            </Link>
            <form action="/auth/signout" method="post">
              <input type="hidden" name="redirectTo" value="/" />
              <button
                type="submit"
                className="rounded-lg px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Sign out
              </button>
            </form>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="mb-10">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-[#1F5F2E]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#1F5F2E]">
              {roleLabel} Portal
            </span>
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {greeting}
          </h1>
          <p className="max-w-2xl text-lg text-slate-600">
            Manage your patients, view appointments, and track care plans all in one place.
          </p>
        </section>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur transition hover:shadow-md">
            <div className="absolute right-4 top-4 rounded-full bg-[#1F5F2E]/10 p-3">
              <UsersIcon />
            </div>
            <div className="relative">
              <p className="text-sm font-medium text-slate-600">Total Patients</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats.totalPatients}</p>
              <p className="mt-1 text-xs text-slate-500">Active care plans</p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur transition hover:shadow-md">
            <div className="absolute right-4 top-4 rounded-full bg-[#9CCB4A]/10 p-3">
              <CalendarIcon />
            </div>
            <div className="relative">
              <p className="text-sm font-medium text-slate-600">Today&apos;s Appointments</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats.todayAppointments}</p>
              <p className="mt-1 text-xs text-slate-500">Scheduled for today</p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur transition hover:shadow-md">
            <div className="absolute right-4 top-4 rounded-full bg-[#E6E15A]/10 p-3">
              <ClockIcon />
            </div>
            <div className="relative">
              <p className="text-sm font-medium text-slate-600">Upcoming</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats.upcomingAppointments}</p>
              <p className="mt-1 text-xs text-slate-500">Future appointments</p>
            </div>
          </div>
        </div>

        {/* Patients Section */}
        <section>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Patients & Care Plans</h2>
              <p className="mt-1 text-sm text-slate-600">
                View and manage patients with active care plans
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:flex-initial">
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 pl-10 text-sm focus:border-[#1F5F2E] focus:outline-none focus:ring-2 focus:ring-[#1F5F2E]/20 sm:w-64"
                />
                <svg
                  className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <Link
                href="/clinician-portal/appointments"
                className="rounded-lg bg-[#1F5F2E] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#174622] hover:shadow-md"
              >
                Manage Appointments
              </Link>
            </div>
          </div>

          {filteredPatients.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white/50 p-12 text-center">
              {searchQuery ? (
                <>
                  <UsersIcon />
                  <p className="mt-4 text-sm font-medium text-slate-900">No patients found</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Try adjusting your search query
                  </p>
                </>
              ) : (
                <>
                  <UsersIcon />
                  <p className="mt-4 text-sm font-medium text-slate-900">No patients yet</p>
                  <p className="mt-1 text-sm text-slate-500">
                    When sponsors purchase plans and patients accept, they will appear here.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.patient_id}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur transition hover:border-[#1F5F2E]/30 hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 border-slate-200 bg-slate-100">
                      {patient.patient_avatar ? (
                        <img
                          src={patient.patient_avatar}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                          <UserIcon />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-semibold text-slate-900">
                        {patient.patient_name}
                      </h3>
                      {patient.patient_age !== null && (
                        <p className="text-sm text-slate-500">{patient.patient_age} years old</p>
                      )}
                      <div className="mt-3 flex items-center gap-2">
                        <span className="rounded-full bg-[#1F5F2E]/10 px-2.5 py-1 text-xs font-medium text-[#1F5F2E]">
                          {patient.plan_name}
                        </span>
                      </div>
                      {patient.next_appointment && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                          <CalendarIcon />
                          <span>
                            {new Date(patient.next_appointment).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}{" "}
                            {new Date(patient.next_appointment).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                          {patient.next_appointment_clinician && (
                            <span className="text-slate-400">•</span>
                          )}
                          {patient.next_appointment_clinician && (
                            <span className="text-slate-500">
                              {patient.next_appointment_clinician}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                    <Link
                      href={`/clinician-portal/appointments?patient=${patient.patient_id}`}
                      className="flex-1 rounded-lg bg-slate-50 px-3 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      View Appointments
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
