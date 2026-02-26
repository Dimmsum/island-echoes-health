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
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/clinician-portal" className="flex items-center gap-3">
              <Image src="/island-echoes-health.svg" alt="Island Echoes Health" width={140} height={50} priority />
            </Link>
            <span className="hidden h-6 w-px bg-slate-200 sm:block" />
            <nav className="flex items-center gap-1.5 text-sm">
              <Link href="/clinician-portal" className="text-slate-500 transition hover:text-[#1F5F2E]">Dashboard</Link>
              <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              <span className="font-medium text-slate-900">Appointments</span>
            </nav>
          </div>
          <Link
            href="/clinician-portal"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Appointments</h1>
          <p className="mt-1 text-sm text-slate-500">View and manage patient appointments. Search, filter, and update status.</p>
        </div>

        <div className="mt-8">
          <AppointmentsList
            appointments={appointmentsWithNames}
            patients={activePatients ?? []}
          />
        </div>
      </main>
    </div>
  );
}
