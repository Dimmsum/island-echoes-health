import { Response } from "express";
import { createSupabaseForUser } from "../lib/supabase.js";
import type { AuthRequest } from "../middleware/auth.js";

export async function getDashboard(req: AuthRequest, res: Response): Promise<void> {
  const supabase = createSupabaseForUser(req.accessToken);
  const userId = req.user.id;

  const { data: plansWithPatients } = await supabase
    .from("sponsor_patient_plans")
    .select("patient_id, care_plan_id, started_at")
    .is("ended_at", null);

  const patientIds = [...new Set((plansWithPatients ?? []).map((p) => p.patient_id))];

  const [patientProfilesRes, carePlansRes, appointmentsRes, todayAppointmentsRes] = await Promise.all([
    patientIds.length ? supabase.from("profiles").select("id, full_name, avatar_url, date_of_birth").in("id", patientIds) : { data: [] },
    supabase.from("care_plans").select("id, name"),
    patientIds.length
      ? supabase
          .from("appointments")
          .select("id, patient_id, clinician_id, scheduled_at, status")
          .in("patient_id", patientIds)
          .order("scheduled_at", { ascending: true })
      : { data: [] },
    patientIds.length
      ? supabase
          .from("appointments")
          .select("id, patient_id, scheduled_at, status")
          .in("patient_id", patientIds)
          .eq("status", "scheduled")
          .gte("scheduled_at", new Date().toISOString().split("T")[0])
          .lt("scheduled_at", new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0])
          .order("scheduled_at", { ascending: true })
      : { data: [] },
  ]);

  const patientProfiles = patientProfilesRes.data ?? [];
  const carePlans = carePlansRes.data ?? [];
  const allAppointments = appointmentsRes.data ?? [];
  const todayAppointments = todayAppointmentsRes.data ?? [];

  const clinicianIds = [...new Set(allAppointments.map((a) => a.clinician_id).filter(Boolean))];
  const { data: clinicianProfiles } =
    clinicianIds.length > 0 ? await supabase.from("profiles").select("id, full_name").in("id", clinicianIds) : { data: [] };

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
    return {
      patient_id: pid,
      patient_name: profile?.full_name ?? "Patient",
      patient_avatar: profile?.avatar_url ?? null,
      plan_name: plan?.name ?? "Plan",
      next_appointment: next?.scheduled_at ?? null,
      next_appointment_clinician: nextClinician?.full_name ?? null,
    };
  });

  const { data: profile } = await supabase.from("profiles").select("role, full_name, avatar_url").eq("id", userId).single();

  res.json({
    profile: profile ?? null,
    patientsWithPlans,
    carePlans,
    allAppointments,
    todayAppointments,
  });
}

export async function getClinicianPortalAppointments(req: AuthRequest, res: Response): Promise<void> {
  const supabase = createSupabaseForUser(req.accessToken);
  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, patient_id, clinician_id, scheduled_at, status")
    .order("scheduled_at", { ascending: true });

  const list = appointments ?? [];
  const patientIds = [...new Set(list.map((a) => a.patient_id))];
  const clinicianIds = [...new Set(list.map((a) => a.clinician_id))];
  const [patientProfiles, clinicianProfiles] = await Promise.all([
    patientIds.length ? supabase.from("profiles").select("id, full_name, avatar_url").in("id", patientIds) : { data: [] },
    clinicianIds.length ? supabase.from("profiles").select("id, full_name").in("id", clinicianIds) : { data: [] },
  ]);

  const appointmentsWithNames = list.map((a) => ({
    ...a,
    patient_name: patientProfiles.data?.find((p) => p.id === a.patient_id)?.full_name ?? "Patient",
    patient_avatar: patientProfiles.data?.find((p) => p.id === a.patient_id)?.avatar_url ?? null,
    clinician_name: clinicianProfiles.data?.find((p) => p.id === a.clinician_id)?.full_name ?? "Clinician",
  }));

  const { data: plansWithPatients } = await supabase.from("sponsor_patient_plans").select("patient_id").is("ended_at", null);
  const activePatientIds = [...new Set((plansWithPatients ?? []).map((p) => p.patient_id))];
  const { data: activePatients } =
    activePatientIds.length > 0 ? await supabase.from("profiles").select("id, full_name").in("id", activePatientIds) : { data: [] };

  res.json({ appointments: appointmentsWithNames, activePatients: activePatients ?? [] });
}

export async function getClinicianPortalAppointmentById(req: AuthRequest, res: Response): Promise<void> {
  const appointmentId = req.params.id;
  const supabase = createSupabaseForUser(req.accessToken);

  const { data: appointment, error } = await supabase
    .from("appointments")
    .select("id, patient_id, clinician_id, scheduled_at, status")
    .eq("id", appointmentId)
    .single();

  if (error || !appointment) {
    res.status(404).json({ error: "Appointment not found." });
    return;
  }

  const [
    patientRes,
    clinicianRes,
    notesRes,
    servicesRes,
    metricsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("id, full_name, avatar_url").eq("id", appointment.patient_id).single(),
    supabase.from("profiles").select("id, full_name, avatar_url").eq("id", appointment.clinician_id).single(),
    supabase.from("appointment_notes").select("id, content, created_at").eq("appointment_id", appointmentId).order("created_at", { ascending: false }),
    supabase.from("appointment_services").select("id, service_type, details, created_at").eq("appointment_id", appointmentId).order("created_at", { ascending: false }),
    supabase
      .from("patient_metrics")
      .select("id, recorded_at, blood_pressure_systolic, blood_pressure_diastolic, weight_kg, a1c, medication_adherence")
      .eq("patient_id", appointment.patient_id)
      .order("recorded_at", { ascending: false })
      .limit(10),
  ]);

  res.json({
    appointment,
    patient: patientRes.data ?? null,
    clinician: clinicianRes.data ?? null,
    notes: notesRes.data ?? [],
    services: servicesRes.data ?? [],
    previousMetrics: metricsRes.data ?? [],
  });
}

export async function getClinicianProfile(req: AuthRequest, res: Response): Promise<void> {
  const supabase = createSupabaseForUser(req.accessToken);
  const userId = req.user.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, avatar_url, created_at")
    .eq("id", userId)
    .single();

  const [{ count: appointmentsCount }, { count: plansCount }] = await Promise.all([
    supabase.from("appointments").select("id", { count: "exact", head: true }).eq("clinician_id", userId),
    supabase.from("sponsor_patient_plans").select("id", { count: "exact", head: true }).is("ended_at", null),
  ]);

  res.json({
    profile: profile ?? null,
    appointmentsCount: appointmentsCount ?? 0,
    plansCount: plansCount ?? 0,
  });
}
