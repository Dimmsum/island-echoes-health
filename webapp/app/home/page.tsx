import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClinicianHome } from "./ClinicianHome";
import { UserHome } from "./UserHome";

const STAFF_ROLES = ["admin", "clinician"] as const;

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  const role = profile?.role as string | undefined;
  const fullName = profile?.full_name ?? null;

  if (role && STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number])) {
    const { data: plansWithPatients } = await supabase
      .from("sponsor_patient_plans")
      .select("patient_id, care_plan_id")
      .is("ended_at", null);

    const patientIds = [...new Set((plansWithPatients ?? []).map((p) => p.patient_id))];
    const { data: patientProfiles } =
      patientIds.length > 0
        ? await supabase.from("profiles").select("id, full_name").in("id", patientIds)
        : { data: [] };
    const { data: carePlans } = await supabase.from("care_plans").select("id, name");

    const { data: nextAppointments } =
      patientIds.length > 0
        ? await supabase
            .from("appointments")
            .select("patient_id, scheduled_at, clinician_id")
            .in("patient_id", patientIds)
            .eq("status", "scheduled")
            .gte("scheduled_at", new Date().toISOString())
            .order("scheduled_at", { ascending: true })
        : { data: [] };

    const nextByPatient = (nextAppointments ?? []).reduce(
      (acc, a) => {
        const current = acc[a.patient_id];
        if (!current || new Date(a.scheduled_at) < new Date(current.scheduled_at))
          acc[a.patient_id] = { scheduled_at: a.scheduled_at, clinician_id: a.clinician_id };
        return acc;
      },
      {} as Record<string, { scheduled_at: string; clinician_id: string }>
    );

    const nextClinicianIds = [...new Set(Object.values(nextByPatient).map((n) => n.clinician_id).filter(Boolean))];
    const { data: nextClinicianProfiles } =
      nextClinicianIds.length > 0
        ? await supabase.from("profiles").select("id, full_name").in("id", nextClinicianIds)
        : { data: [] };

    const patientsWithPlans = patientIds.map((pid) => {
      const link = plansWithPatients?.find((p) => p.patient_id === pid);
      const profile = patientProfiles?.find((p) => p.id === pid);
      const plan = carePlans?.find((p) => p.id === link?.care_plan_id);
      const next = nextByPatient[pid];
      const nextClinician = next ? nextClinicianProfiles?.find((p) => p.id === next.clinician_id) : null;
      return {
        patient_id: pid,
        patient_name: profile?.full_name ?? "Patient",
        plan_name: plan?.name ?? "Plan",
        next_appointment: next?.scheduled_at ?? null,
        next_appointment_clinician: nextClinician?.full_name ?? null,
      };
    });

    return (
      <ClinicianHome
        fullName={fullName}
        role={role as "admin" | "clinician"}
        patientsWithPlans={patientsWithPlans}
      />
    );
  }

  // User (sponsor/patient) data
  const [linkedPlansResult, pendingConsentResult, appointmentsResult, notificationsResult, carePlansResult] =
    await Promise.all([
      supabase
        .from("sponsor_patient_plans")
        .select("id, started_at, care_plan_id, patient_id")
        .eq("sponsor_id", user.id)
        .is("ended_at", null)
        .order("started_at", { ascending: false }),
      supabase
        .from("sponsorship_consent_requests")
        .select("id, patient_email, care_plan_id, sponsor_id")
        .eq("patient_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      supabase
        .from("appointments")
        .select("id, scheduled_at, status, clinician_id")
        .eq("patient_id", user.id)
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(5),
      supabase
        .from("notifications")
        .select("id, type, title, body, read_at, created_at, reference_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("care_plans").select("id, slug, name, price_cents, features").order("price_cents", { ascending: true }),
    ]);

  const linkedPlans = linkedPlansResult.data ?? [];
  const pendingConsents = pendingConsentResult.data ?? [];
  const carePlans = carePlansResult.data ?? [];

  const patientIds = [...new Set(linkedPlans.map((p) => p.patient_id))];
  const sponsorIds = [...new Set(pendingConsents.map((c) => c.sponsor_id))];
  const { data: patientProfiles } =
    patientIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", patientIds)
      : { data: [] };
  const { data: sponsorProfiles } =
    sponsorIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", sponsorIds)
      : { data: [] };

  const linkedPatients = linkedPlans.map((p) => {
    const plan = carePlans.find((c) => c.id === p.care_plan_id);
    const patient = patientProfiles?.find((pr) => pr.id === p.patient_id);
    return {
      id: p.id,
      started_at: p.started_at,
      care_plan: plan ? { id: plan.id, name: plan.name, slug: plan.slug, price_cents: plan.price_cents } : null,
      patient: patient ? { id: patient.id, full_name: patient.full_name } : null,
    };
  });

  const pendingConsentsWithDetails = pendingConsents.map((c) => {
    const plan = carePlans.find((x) => x.id === c.care_plan_id);
    const sponsor = sponsorProfiles?.find((s) => s.id === c.sponsor_id);
    return {
      id: c.id,
      patient_email: c.patient_email,
      care_plan: plan ? { id: plan.id, name: plan.name } : null,
      sponsor_name: sponsor?.full_name ?? "A sponsor",
    };
  });

  const rawAppointments = appointmentsResult.data ?? [];
  const clinicianIds = [...new Set(rawAppointments.map((a) => a.clinician_id).filter(Boolean))];
  const { data: clinicianProfiles } =
    clinicianIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", clinicianIds)
      : { data: [] };
  const upcomingAppointments = rawAppointments.map((a) => ({
    ...a,
    clinician_name: clinicianProfiles?.find((p) => p.id === a.clinician_id)?.full_name ?? null,
  }));
  const notifications = notificationsResult.data ?? [];

  return (
    <UserHome
      fullName={fullName}
      linkedPatients={linkedPatients}
      pendingConsents={pendingConsentsWithDetails}
      upcomingAppointments={upcomingAppointments}
      notifications={notifications}
      carePlans={carePlans}
    />
  );
}
