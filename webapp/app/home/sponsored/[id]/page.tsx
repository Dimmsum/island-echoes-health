import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SponsoredPatientPage({ params }: Props) {
  const { id: linkId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: link, error: linkError } = await supabase
    .from("sponsor_patient_plans")
    .select("id, patient_id, care_plan_id, started_at")
    .eq("id", linkId)
    .eq("sponsor_id", user.id)
    .is("ended_at", null)
    .single();

  if (linkError || !link) redirect("/home");

  const [patientResult, planResult, metricsResult, appointmentsResult] = await Promise.all([
    supabase.from("profiles").select("id, full_name, date_of_birth, avatar_url").eq("id", link.patient_id).single(),
    supabase.from("care_plans").select("id, name, slug, price_cents").eq("id", link.care_plan_id).single(),
    supabase
      .from("patient_metrics")
      .select("id, recorded_at, blood_pressure_systolic, blood_pressure_diastolic, weight_kg, a1c, medication_adherence")
      .eq("patient_id", link.patient_id)
      .order("recorded_at", { ascending: false })
      .limit(20),
    supabase
      .from("appointments")
      .select("id, scheduled_at, status, clinician_id")
      .eq("patient_id", link.patient_id)
      .order("scheduled_at", { ascending: false })
      .limit(30),
  ]);

  const patient = patientResult.data;
  const plan = planResult.data;
  const metrics = metricsResult.data ?? [];
  const rawAppointments = appointmentsResult.data ?? [];

  const clinicianIds = [...new Set(rawAppointments.map((a) => a.clinician_id).filter(Boolean))];
  const { data: clinicianProfiles } =
    clinicianIds.length > 0
      ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", clinicianIds)
      : { data: [] };
  const appointments = rawAppointments.map((a) => {
    const clinician = clinicianProfiles?.find((p) => p.id === a.clinician_id);
    return {
      ...a,
      clinician_name: clinician?.full_name ?? null,
      clinician_avatar_url: clinician?.avatar_url ?? null,
    };
  });

  const appointmentIds = appointments.map((a) => a.id);
  const { data: notes } =
    appointmentIds.length > 0
      ? await supabase
          .from("appointment_notes")
          .select("id, appointment_id, content, created_at")
          .in("appointment_id", appointmentIds)
          .order("created_at", { ascending: false })
      : { data: [] };

  const notesByAppointment = (notes ?? []).reduce(
    (acc, n) => {
      if (!acc[n.appointment_id]) acc[n.appointment_id] = [];
      acc[n.appointment_id].push(n);
      return acc;
    },
    {} as Record<string, { id: string; content: string; created_at: string }[]>
  );

  const patientName = patient?.full_name ?? "Patient";
  const patientAvatar = patient?.avatar_url ?? null;
  const patientAge =
    patient?.date_of_birth != null
      ? Math.floor(
          (Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        )
      : null;
  const startedDate = new Date(link.started_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const scheduledCount = appointments.filter((a) => a.status === "scheduled").length;
  const completedCount = appointments.filter((a) => a.status === "completed").length;

  const latestMetric = metrics[0] ?? null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-[#E6E15A]/20 blur-3xl" />
        <div className="absolute right-[-10rem] bottom-[-10rem] h-[32rem] w-[48rem] rounded-full bg-[#9CCB4A]/15 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-[#1F5F2E]/5 blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto min-h-screen w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-3">
            <Image src="/island-echoes-health.svg" alt="Island Echoes Health" width={140} height={50} priority />
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/home" className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Dashboard
            </Link>
          </nav>
        </header>

        {/* Breadcrumbs */}
        <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/home" className="hover:text-[#1F5F2E]">Home</Link>
          <span>/</span>
          <Link href="/home#patients" className="hover:text-[#1F5F2E]">Patients</Link>
          <span>/</span>
          <span className="font-medium text-slate-900">{patientName}</span>
        </div>

        {/* Patient Hero Card */}
        <section className="mt-8">
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              {/* Avatar */}
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-slate-200 bg-slate-100 sm:h-28 sm:w-28">
                {patientAvatar ? (
                  <img src={patientAvatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    {patientName}
                  </h1>
                  {patientAge != null && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                      {patientAge} years old
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-[#1F5F2E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {plan?.name ?? "Care plan"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Sponsored since {startedDate}
                  </span>
                </div>
              </div>

              {/* Quick stats */}
              {plan?.price_cents != null && (
                <div className="shrink-0 rounded-xl border border-[#1F5F2E]/20 bg-[#1F5F2E]/5 px-5 py-3 text-center">
                  <p className="text-2xl font-bold text-[#1F5F2E]">
                    ${(plan.price_cents / 100).toFixed(0)}
                  </p>
                  <p className="text-xs font-medium text-[#1F5F2E]/70">/ month</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Stats Row */}
        <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white/90 p-4 text-center shadow-sm backdrop-blur">
            <p className="text-2xl font-bold text-slate-900">{appointments.length}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">Total visits</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/90 p-4 text-center shadow-sm backdrop-blur">
            <p className="text-2xl font-bold text-[#1F5F2E]">{scheduledCount}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">Upcoming</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/90 p-4 text-center shadow-sm backdrop-blur">
            <p className="text-2xl font-bold text-slate-900">{completedCount}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">Completed</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/90 p-4 text-center shadow-sm backdrop-blur">
            <p className="text-2xl font-bold text-slate-900">{metrics.length}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">Metrics recorded</p>
          </div>
        </section>

        {/* Latest Vitals Snapshot */}
        {latestMetric && (
          <section className="mt-6">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-red-50 p-2.5 text-red-500">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">Latest vitals</h2>
                </div>
                <span className="text-xs text-slate-500">
                  {new Date(latestMetric.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-500">Blood Pressure</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {latestMetric.blood_pressure_systolic != null && latestMetric.blood_pressure_diastolic != null
                      ? `${latestMetric.blood_pressure_systolic}/${latestMetric.blood_pressure_diastolic}`
                      : "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-500">Weight</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {latestMetric.weight_kg != null ? `${latestMetric.weight_kg} kg` : "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-500">A1C</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {latestMetric.a1c != null ? latestMetric.a1c : "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-500">Adherence</p>
                  <p className="mt-1 text-lg font-bold capitalize text-slate-900">
                    {latestMetric.medication_adherence ?? "—"}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* Metrics History */}
          <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#1F5F2E]/10 p-2.5 text-[#1F5F2E]">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Metrics history</h2>
                <p className="text-sm text-slate-500">{metrics.length} records</p>
              </div>
            </div>
            {metrics.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
                <svg className="mx-auto h-10 w-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="mt-3 text-sm font-medium text-slate-900">No metrics recorded yet</p>
                <p className="mt-1 text-xs text-slate-500">Health data will appear here once recorded</p>
              </div>
            ) : (
              <div className="mt-4 max-h-[28rem] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-slate-200 text-left">
                      <th className="pb-2 pr-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                      <th className="pb-2 pr-3 text-xs font-semibold uppercase tracking-wider text-slate-500">BP</th>
                      <th className="pb-2 pr-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Weight</th>
                      <th className="pb-2 pr-3 text-xs font-semibold uppercase tracking-wider text-slate-500">A1C</th>
                      <th className="pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Adherence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((m) => (
                      <tr key={m.id} className="border-b border-slate-100 transition hover:bg-slate-50">
                        <td className="py-2.5 pr-3 text-slate-700">
                          {new Date(m.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </td>
                        <td className="py-2.5 pr-3 font-medium text-slate-900">
                          {m.blood_pressure_systolic != null && m.blood_pressure_diastolic != null
                            ? `${m.blood_pressure_systolic}/${m.blood_pressure_diastolic}`
                            : "—"}
                        </td>
                        <td className="py-2.5 pr-3 text-slate-700">
                          {m.weight_kg != null ? `${m.weight_kg} kg` : "—"}
                        </td>
                        <td className="py-2.5 pr-3 text-slate-700">
                          {m.a1c != null ? m.a1c : "—"}
                        </td>
                        <td className="py-2.5 capitalize text-slate-700">
                          {m.medication_adherence ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Appointments */}
          <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#1F5F2E]/10 p-2.5 text-[#1F5F2E]">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Appointments</h2>
                <p className="text-sm text-slate-500">{appointments.length} total</p>
              </div>
            </div>
            {appointments.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
                <svg className="mx-auto h-10 w-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-3 text-sm font-medium text-slate-900">No appointments yet</p>
                <p className="mt-1 text-xs text-slate-500">Scheduled visits will appear here</p>
              </div>
            ) : (
              <ul className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto">
                {appointments.slice(0, 15).map((apt) => {
                  const date = new Date(apt.scheduled_at);
                  const isUpcoming = apt.status === "scheduled" && date > new Date();
                  return (
                    <li
                      key={apt.id}
                      className={`rounded-xl border p-4 transition ${
                        isUpcoming
                          ? "border-[#1F5F2E]/20 bg-[#1F5F2E]/5"
                          : "border-slate-100 bg-white hover:border-slate-200"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100 flex items-center justify-center">
                          {apt.clinician_avatar_url ? (
                            <img src={apt.clinician_avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-900">
                              {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                            </p>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                              apt.status === "scheduled" ? "bg-blue-100 text-blue-700" :
                              apt.status === "completed" ? "bg-green-100 text-green-700" :
                              apt.status === "no_show" ? "bg-amber-100 text-amber-700" :
                              "bg-slate-100 text-slate-600"
                            }`}>
                              {apt.status.replace("_", " ")}
                            </span>
                          </div>
                          <p className="mt-0.5 text-sm text-slate-600">
                            {date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                            {apt.clinician_name && ` · ${apt.clinician_name}`}
                          </p>
                        </div>
                      </div>
                      {notesByAppointment[apt.id]?.length > 0 && (
                        <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Visit notes</p>
                          {notesByAppointment[apt.id].map((note) => (
                            <p key={note.id} className="mt-1.5 text-sm leading-relaxed text-slate-700">
                              {note.content}
                            </p>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
