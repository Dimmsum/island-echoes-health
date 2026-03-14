import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchApiJson } from "@/lib/api";
import { AppointmentsList } from "./AppointmentsList";

export default async function ClinicianAppointmentsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();
  const role = profile?.role;
  if (role !== "clinician" && role !== "admin") redirect("/home");

  const { appointments, activePatients } = await fetchApiJson<{
    appointments: { id: string; patient_id: string; clinician_id: string; scheduled_at: string; status: string; patient_name?: string; patient_avatar?: string | null; clinician_name?: string }[];
    activePatients: { id: string; full_name: string | null }[];
  }>(session.access_token, "/api/clinician-portal/appointments");

  const appointmentsWithNames = appointments.map((a) => ({
    ...a,
    patient_name: a.patient_name ?? "Patient",
    clinician_name: a.clinician_name ?? "Clinician",
  }));

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
            patients={activePatients}
          />
        </section>
      </main>
    </div>
  );
}
