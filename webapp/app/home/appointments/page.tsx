import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppointmentsList } from "./AppointmentsList";

export default async function ClinicianAppointmentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

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
      ? await supabase.from("profiles").select("id, full_name").in("id", patientIds)
      : { data: [] };
  const { data: clinicianProfiles } =
    clinicianIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", clinicianIds)
      : { data: [] };

  const appointmentsWithNames = (appointments ?? []).map((a) => ({
    ...a,
    patient_name: patientProfiles?.find((p) => p.id === a.patient_id)?.full_name ?? "Patient",
    clinician_name: clinicianProfiles?.find((p) => p.id === a.clinician_id)?.full_name ?? "Clinician",
  }));

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
            ← Dashboard
          </Link>
        </header>

        <section className="mt-10">
          <h1 className="text-2xl font-semibold text-slate-900">Appointments</h1>
          <p className="mt-1 text-slate-600">
            Create, reschedule, cancel, and mark attendance.
          </p>

          <AppointmentsList
            appointments={appointmentsWithNames}
            patients={activePatients ?? []}
          />
        </section>
      </main>
    </div>
  );
}
