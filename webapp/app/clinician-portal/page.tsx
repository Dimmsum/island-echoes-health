import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClinicianPortalDashboard } from "./ClinicianPortalDashboard";

const STAFF_ROLES = ["admin", "clinician"] as const;

export default async function ClinicianPortalPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/clinician");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, avatar_url")
    .eq("id", user.id)
    .single();

  const role = profile?.role as string | undefined;
  const fullName = profile?.full_name ?? null;
  const avatarUrl = profile?.avatar_url ?? null;

  if (!role || !STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number])) {
    redirect("/home");
  }

  // Fetch all patients with active plans
  const { data: plansWithPatients } = await supabase
    .from("sponsor_patient_plans")
    .select("patient_id, care_plan_id, started_at")
    .is("ended_at", null);

  const patientIds = [...new Set((plansWithPatients ?? []).map((p) => p.patient_id))];
  
  const [patientProfilesResult, carePlansResult, appointmentsResult, todayAppointmentsResult] = await Promise.all([
    patientIds.length > 0
      ? supabase.from("profiles").select("id, full_name, avatar_url, date_of_birth").in("id", patientIds)
      : Promise.resolve({ data: [] }),
    supabase.from("care_plans").select("id, name"),
    patientIds.length > 0
      ? supabase
          .from("appointments")
          .select("id, patient_id, clinician_id, scheduled_at, status")
          .in("patient_id", patientIds)
          .order("scheduled_at", { ascending: true })
      : Promise.resolve({ data: [] }),
    patientIds.length > 0
      ? supabase
          .from("appointments")
          .select("id, patient_id, scheduled_at, status")
          .in("patient_id", patientIds)
          .eq("status", "scheduled")
          .gte("scheduled_at", new Date().toISOString().split("T")[0])
          .lt("scheduled_at", new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0])
          .order("scheduled_at", { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  const patientProfiles = patientProfilesResult.data ?? [];
  const carePlans = carePlansResult.data ?? [];
  const allAppointments = appointmentsResult.data ?? [];
  const todayAppointments = todayAppointmentsResult.data ?? [];

  // Get clinician names for appointments
  const clinicianIds = [...new Set(allAppointments.map((a) => a.clinician_id).filter(Boolean))];
  const { data: clinicianProfiles } =
    clinicianIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", clinicianIds)
      : { data: [] };

  // Build patient data with next appointments
  const nextByPatient = allAppointments
    .filter((a) => a.status === "scheduled" && new Date(a.scheduled_at) >= new Date())
    .reduce(
      (acc, a) => {
        const current = acc[a.patient_id];
        if (!current || new Date(a.scheduled_at) < new Date(current.scheduled_at))
          acc[a.patient_id] = { scheduled_at: a.scheduled_at, clinician_id: a.clinician_id };
        return acc;
      },
      {} as Record<string, { scheduled_at: string; clinician_id: string }>
    );

  const patientsWithPlans = patientIds.map((pid) => {
    const link = plansWithPatients?.find((p) => p.patient_id === pid);
    const profile = patientProfiles.find((p) => p.id === pid);
    const plan = carePlans.find((p) => p.id === link?.care_plan_id);
    const next = nextByPatient[pid];
    const nextClinician = next ? clinicianProfiles?.find((p) => p.id === next.clinician_id) : null;
    
    // Calculate age if date_of_birth exists
    const age = profile?.date_of_birth
      ? Math.floor(
          (Date.now() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        )
      : null;

    return {
      patient_id: pid,
      patient_name: profile?.full_name ?? "Patient",
      patient_avatar: profile?.avatar_url ?? null,
      patient_age: age,
      plan_name: plan?.name ?? "Plan",
      plan_id: plan?.id ?? null,
      started_at: link?.started_at ?? null,
      next_appointment: next?.scheduled_at ?? null,
      next_appointment_clinician: nextClinician?.full_name ?? null,
    };
  });

  // Calculate stats
  const totalPatients = patientsWithPlans.length;
  const upcomingAppointmentsCount = allAppointments.filter(
    (a) => a.status === "scheduled" && new Date(a.scheduled_at) >= new Date()
  ).length;
  const todayAppointmentsCount = todayAppointments.length;

  return (
    <ClinicianPortalDashboard
      fullName={fullName}
      avatarUrl={avatarUrl}
      role={role as "admin" | "clinician"}
      patientsWithPlans={patientsWithPlans}
      stats={{
        totalPatients,
        upcomingAppointments: upcomingAppointmentsCount,
        todayAppointments: todayAppointmentsCount,
      }}
    />
  );
}
