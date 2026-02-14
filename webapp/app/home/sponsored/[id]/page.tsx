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
    supabase.from("profiles").select("id, full_name").eq("id", link.patient_id).single(),
    supabase.from("care_plans").select("id, name").eq("id", link.care_plan_id).single(),
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
      ? await supabase.from("profiles").select("id, full_name").in("id", clinicianIds)
      : { data: [] };
  const appointments = rawAppointments.map((a) => ({
    ...a,
    clinician_name: clinicianProfiles?.find((p) => p.id === a.clinician_id)?.full_name ?? null,
  }));

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

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-80 w-80 rounded-full bg-[#E6E15A]/25 blur-3xl" />
        <div className="absolute right-[-10rem] bottom-[-10rem] h-[26rem] w-[40rem] rounded-full bg-[#9CCB4A]/30 blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto min-h-screen w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
        <header className="flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-3">
            <Image
              src="/island-echoes-health.svg"
              alt="Island Echoes Health"
              width={140}
              height={50}
              priority
            />
          </Link>
          <Link
            href="/home"
            className="text-sm font-medium text-[#1F5F2E] hover:underline"
          >
            ← Back to dashboard
          </Link>
        </header>

        <section className="mt-10">
          <h1 className="text-2xl font-semibold text-slate-900">{patientName}</h1>
          <p className="mt-1 text-slate-600">{plan?.name ?? "Care plan"}</p>

          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 backdrop-blur">
              <h2 className="text-lg font-semibold text-slate-900">Metrics</h2>
              {metrics.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No metrics recorded yet.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-600">
                        <th className="pb-2 pr-4">Date</th>
                        <th className="pb-2 pr-4">BP</th>
                        <th className="pb-2 pr-4">Weight</th>
                        <th className="pb-2 pr-4">A1C</th>
                        <th className="pb-2">Adherence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.map((m) => (
                        <tr key={m.id} className="border-b border-slate-100">
                          <td className="py-2 pr-4 text-slate-700">
                            {new Date(m.recorded_at).toLocaleDateString()}
                          </td>
                          <td className="py-2 pr-4">
                            {m.blood_pressure_systolic != null && m.blood_pressure_diastolic != null
                              ? `${m.blood_pressure_systolic}/${m.blood_pressure_diastolic}`
                              : "—"}
                          </td>
                          <td className="py-2 pr-4">
                            {m.weight_kg != null ? `${m.weight_kg} kg` : "—"}
                          </td>
                          <td className="py-2 pr-4">
                            {m.a1c != null ? m.a1c : "—"}
                          </td>
                          <td className="py-2 capitalize text-slate-700">
                            {m.medication_adherence ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 backdrop-blur">
              <h2 className="text-lg font-semibold text-slate-900">Appointments</h2>
              {appointments.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No appointments yet.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {appointments.slice(0, 15).map((apt) => (
                    <li
                      key={apt.id}
                      className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-white p-3"
                    >
                      <span className="text-sm font-medium text-slate-900">
                        {new Date(apt.scheduled_at).toLocaleString()}
                        {apt.clinician_name && (
                          <span className="ml-2 font-normal text-slate-600">
                            with {apt.clinician_name}
                          </span>
                        )}
                      </span>
                      <span className="text-xs capitalize text-slate-500">
                        {apt.status}
                      </span>
                      {notesByAppointment[apt.id]?.length > 0 && (
                        <div className="mt-2 border-t border-slate-100 pt-2">
                          <p className="text-xs font-medium text-slate-600">
                            Visit notes
                          </p>
                          {notesByAppointment[apt.id].map((note) => (
                            <p
                              key={note.id}
                              className="mt-1 text-sm text-slate-700"
                            >
                              {note.content}
                            </p>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
