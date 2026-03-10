import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchApiJson } from "@/lib/api";
import { AppointmentDetailClient } from "./AppointmentDetailClient";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AppointmentDetailPage({ params }: Props) {
  const { id } = await params;
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
  if (profile?.role !== "clinician" && profile?.role !== "admin") redirect("/home");

  let data: {
    appointment: { id: string; patient_id: string; clinician_id: string; scheduled_at: string; status: string };
    patient: { id: string; full_name: string | null; avatar_url?: string | null } | null;
    clinician: { id: string; full_name: string | null; avatar_url?: string | null } | null;
    notes: { id: string; content: string; created_at: string }[];
    services: { id: string; service_type: string; details: string | null; created_at: string }[];
  };
  try {
    data = await fetchApiJson(session.access_token, `/api/home/appointments/${id}`);
  } catch {
    redirect("/home/appointments");
  }

  const { appointment, patient, clinician, notes, services } = data;

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
            href="/home/appointments"
            className="text-sm font-medium text-[#1F5F2E] hover:underline"
          >
            ← Appointments
          </Link>
        </header>

        <section className="mt-10">
          <h1 className="text-2xl font-semibold text-slate-900">Appointment</h1>
          <p className="mt-1 text-slate-600">
            {patient?.full_name ?? "Patient"} with {clinician?.full_name ?? "Clinician"} —{" "}
            {new Date(appointment.scheduled_at).toLocaleString()} —{" "}
            <span className="capitalize">{appointment.status}</span>
          </p>

          <AppointmentDetailClient
            appointmentId={id}
            patientId={appointment.patient_id}
            notes={notes ?? []}
            services={services ?? []}
          />
        </section>
      </main>
    </div>
  );
}
