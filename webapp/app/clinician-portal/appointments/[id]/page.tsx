import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClinicianAppointmentDetailClient } from "./AppointmentDetailClient";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ClinicianPortalAppointmentDetailPage({ params }: Props) {
  const { id } = await params;
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
  if (profile?.role !== "clinician" && profile?.role !== "admin") redirect("/home");

  const { data: appointment, error } = await supabase
    .from("appointments")
    .select("id, patient_id, clinician_id, scheduled_at, status")
    .eq("id", id)
    .single();

  if (error || !appointment) redirect("/clinician-portal/appointments");

  const [
    { data: patient },
    { data: clinician },
    { data: notes },
    { data: services },
  ] = await Promise.all([
    supabase.from("profiles").select("id, full_name").eq("id", appointment.patient_id).single(),
    supabase.from("profiles").select("id, full_name").eq("id", appointment.clinician_id).single(),
    supabase
      .from("appointment_notes")
      .select("id, content, created_at")
      .eq("appointment_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("appointment_services")
      .select("id, service_type, details, created_at")
      .eq("appointment_id", id)
      .order("created_at", { ascending: false }),
  ]);

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
              <Link href="/clinician-portal/appointments" className="text-slate-500 transition hover:text-[#1F5F2E]">Appointments</Link>
              <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              <span className="font-medium text-slate-900">Detail</span>
            </nav>
          </div>
          <Link
            href="/clinician-portal/appointments"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to appointments
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ClinicianAppointmentDetailClient
          appointmentId={id}
          patientId={appointment.patient_id}
          patientName={patient?.full_name ?? null}
          clinicianName={clinician?.full_name ?? null}
          scheduledAt={appointment.scheduled_at}
          status={appointment.status}
          notes={notes ?? []}
          services={services ?? []}
        />
      </main>
    </div>
  );
}
