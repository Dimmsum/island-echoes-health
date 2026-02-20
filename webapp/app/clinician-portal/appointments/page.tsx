import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppointmentsList } from "./AppointmentsList";

export default async function ClinicianPortalAppointmentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/clinician");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role;
  if (role !== "clinician" && role !== "admin") redirect("/home");

  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, patient_id, clinician_id, scheduled_at, status")
    .order("scheduled_at", { ascending: true });

  const patientIds = [...new Set((appointments ?? []).map((a) => a.patient_id))];
  const clinicianIds = [...new Set((appointments ?? []).map((a) => a.clinician_id))];
  const { data: patientProfiles } =
    patientIds.length > 0
      ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", patientIds)
      : { data: [] };
  const { data: clinicianProfiles } =
    clinicianIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", clinicianIds)
      : { data: [] };

  const appointmentsWithNames = (appointments ?? []).map((a) => {
    const patient = patientProfiles?.find((p) => p.id === a.patient_id);
    return {
      ...a,
      patient_name: patient?.full_name ?? "Patient",
      patient_avatar: patient?.avatar_url ?? null,
      clinician_name: clinicianProfiles?.find((p) => p.id === a.clinician_id)?.full_name ?? "Clinician",
    };
  });

  const { data: plansWithPatients } = await supabase
    .from("sponsor_patient_plans")
    .select("patient_id")
    .is("ended_at", null);
  const activePatientIds = [...new Set((plansWithPatients ?? []).map((p) => p.patient_id))];
  const { data: activePatients } =
    activePatientIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", activePatientIds)
      : { data: [] };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f1419]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-[420px] w-full bg-gradient-to-b from-[#1F5F2E]/40 via-[#1F5F2E]/10 to-transparent" />
        <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-[#9CCB4A]/20 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-[#1F5F2E]/15 blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto min-h-screen w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/clinician-portal" className="flex items-center gap-3">
              <Image
                src="/island-echoes-health.svg"
                alt="Island Echoes Health"
                width={140}
                height={50}
                priority
                className="h-9 w-auto"
              />
            </Link>
            <span className="hidden h-6 w-px bg-white/20 sm:block" />
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/clinician-portal"
                className="rounded-lg px-3 py-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                Dashboard
              </Link>
              <span className="text-slate-600">/</span>
              <span className="px-3 py-2 font-medium text-white">Appointments</span>
            </nav>
          </div>
          <Link
            href="/clinician-portal"
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <span aria-hidden>←</span>
            Back to dashboard
          </Link>
        </header>

        <section className="mt-10">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-[#1F5F2E]/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#9CCB4A]">
              Clinician portal
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Appointments
          </h1>
          <p className="mt-2 max-w-xl text-slate-400">
            View and manage patient appointments. Search, filter, and update status.
          </p>
        </section>

        <div className="mt-10">
          <AppointmentsList
            appointments={appointmentsWithNames}
            patients={activePatients ?? []}
          />
        </div>
      </main>
    </div>
  );
}
