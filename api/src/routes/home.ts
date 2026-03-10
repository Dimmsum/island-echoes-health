import { Response } from "express";
import { createSupabaseForUser } from "../lib/supabase.js";
import type { AuthRequest } from "../middleware/auth.js";

export async function getHome(req: AuthRequest, res: Response): Promise<void> {
  const supabase = createSupabaseForUser(req.accessToken);
  const userId = req.user.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", userId)
    .single();

  const [
    linkedPlansRes,
    plansWherePatientRes,
    pendingConsentRes,
    appointmentsRes,
    notificationsRes,
    carePlansRes,
  ] = await Promise.all([
    supabase
      .from("sponsor_patient_plans")
      .select("id, started_at, care_plan_id, patient_id")
      .eq("sponsor_id", userId)
      .is("ended_at", null)
      .order("started_at", { ascending: false }),
    supabase
      .from("sponsor_patient_plans")
      .select("id, started_at, care_plan_id, sponsor_id")
      .eq("patient_id", userId)
      .is("ended_at", null)
      .order("started_at", { ascending: false }),
    supabase
      .from("sponsorship_consent_requests")
      .select("id, patient_email, care_plan_id, sponsor_id")
      .eq("patient_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("appointments")
      .select("id, scheduled_at, status, clinician_id")
      .eq("patient_id", userId)
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(5),
    supabase
      .from("notifications")
      .select("id, type, title, body, read_at, created_at, reference_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("care_plans").select("id, slug, name, price_cents, features").order("price_cents", { ascending: true }),
  ]);

  const linkedPlans = linkedPlansRes.data ?? [];
  const plansWherePatient = plansWherePatientRes.data ?? [];
  const pendingConsents = pendingConsentRes.data ?? [];
  const carePlans = carePlansRes.data ?? [];
  const notifications = notificationsRes.data ?? [];
  const ownAppointments = appointmentsRes.data ?? [];

  const patientIds = [...new Set(linkedPlans.map((p) => p.patient_id))];
  const sponsorIds = [...new Set(pendingConsents.map((c) => c.sponsor_id))];
  const mySponsorIds = [...new Set(plansWherePatient.map((p) => p.sponsor_id))];

  const [patientProfiles, sponsorProfiles, mySponsorProfiles] = await Promise.all([
    patientIds.length ? supabase.from("profiles").select("id, full_name, date_of_birth, avatar_url").in("id", patientIds) : { data: [] },
    sponsorIds.length ? supabase.from("profiles").select("id, full_name, avatar_url").in("id", sponsorIds) : { data: [] },
    mySponsorIds.length ? supabase.from("profiles").select("id, full_name, avatar_url").in("id", mySponsorIds) : { data: [] },
  ]);

  const mySponsors = plansWherePatient.map((p) => {
    const plan = carePlans.find((c) => c.id === p.care_plan_id);
    const sponsor = mySponsorProfiles.data?.find((pr) => pr.id === p.sponsor_id);
    return {
      id: p.id,
      started_at: p.started_at,
      care_plan: plan ? { id: plan.id, name: plan.name } : null,
      sponsor: sponsor ? { id: sponsor.id, full_name: sponsor.full_name, avatar_url: sponsor.avatar_url ?? null } : null,
    };
  });

  const linkedPatients = linkedPlans.map((p) => {
    const plan = carePlans.find((c) => c.id === p.care_plan_id);
    const patient = patientProfiles.data?.find((pr) => pr.id === p.patient_id);
    const dob = patient?.date_of_birth;
    const age = dob != null ? Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;
    return {
      id: p.id,
      started_at: p.started_at,
      care_plan: plan ? { id: plan.id, name: plan.name, slug: plan.slug, price_cents: plan.price_cents } : null,
      patient: patient ? { id: patient.id, full_name: patient.full_name, age, avatar_url: patient.avatar_url ?? null } : null,
    };
  });

  const pendingConsentsWithDetails = pendingConsents.map((c) => {
    const plan = carePlans.find((x) => x.id === c.care_plan_id);
    const sponsor = sponsorProfiles.data?.find((s) => s.id === c.sponsor_id);
    return {
      id: c.id,
      patient_email: c.patient_email,
      care_plan: plan ? { id: plan.id, name: plan.name } : null,
      sponsor_name: sponsor?.full_name ?? "A sponsor",
    };
  });

  const { data: sponsoredAppointments } =
    patientIds.length > 0
      ? await supabase
          .from("appointments")
          .select("id, scheduled_at, status, clinician_id, patient_id")
          .in("patient_id", patientIds)
          .gte("scheduled_at", new Date().toISOString())
          .order("scheduled_at", { ascending: true })
          .limit(10)
      : { data: [] };

  const rawAppointments = [
    ...ownAppointments.map((a) => ({ ...a, patient_id: userId })),
    ...(sponsoredAppointments ?? []).filter((sa) => !ownAppointments.some((oa) => oa.id === sa.id)),
  ].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  const clinicianIds = [...new Set(rawAppointments.map((a) => a.clinician_id).filter(Boolean))];
  const { data: clinicianProfiles } =
    clinicianIds.length > 0 ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", clinicianIds) : { data: [] };

  const upcomingAppointments = rawAppointments.map((a) => {
    const clinician = clinicianProfiles?.find((p) => p.id === a.clinician_id);
    const patient = patientProfiles.data?.find((p) => p.id === a.patient_id);
    const isOwn = a.patient_id === userId;
    return {
      ...a,
      clinician_name: clinician?.full_name ?? null,
      clinician_avatar_url: clinician?.avatar_url ?? null,
      patient_name: isOwn ? null : (patient?.full_name ?? "Patient"),
    };
  });

  res.json({
    profile: profile ?? null,
    linkedPatients,
    mySponsors,
    pendingConsents: pendingConsentsWithDetails,
    upcomingAppointments,
    notifications,
    carePlans,
  });
}

export async function getHomeProfile(req: AuthRequest, res: Response): Promise<void> {
  const supabase = createSupabaseForUser(req.accessToken);
  const userId = req.user.id;

  const [linkedPlansRes, plansWherePatientRes, notificationsRes, carePlansRes] = await Promise.all([
    supabase
      .from("sponsor_patient_plans")
      .select("id, started_at, care_plan_id, patient_id")
      .eq("sponsor_id", userId)
      .is("ended_at", null)
      .order("started_at", { ascending: false }),
    supabase
      .from("sponsor_patient_plans")
      .select("id, started_at, care_plan_id, sponsor_id")
      .eq("patient_id", userId)
      .is("ended_at", null)
      .order("started_at", { ascending: false }),
    supabase
      .from("notifications")
      .select("id, type, title, body, read_at, created_at, reference_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("care_plans").select("id, name, slug, price_cents"),
  ]);

  const linkedPlans = linkedPlansRes.data ?? [];
  const plansWherePatient = plansWherePatientRes.data ?? [];
  const carePlans = carePlansRes.data ?? [];
  const notifications = notificationsRes.data ?? [];

  const patientIds = [...new Set(linkedPlans.map((p) => p.patient_id))];
  const mySponsorIds = [...new Set(plansWherePatient.map((p) => p.sponsor_id))];

  const [patientProfiles, mySponsorProfiles] = await Promise.all([
    patientIds.length ? supabase.from("profiles").select("id, full_name, date_of_birth, avatar_url").in("id", patientIds) : { data: [] },
    mySponsorIds.length ? supabase.from("profiles").select("id, full_name, avatar_url").in("id", mySponsorIds) : { data: [] },
  ]);

  const linkedPatients = linkedPlans.map((p) => {
    const plan = carePlans.find((c) => c.id === p.care_plan_id);
    const patient = patientProfiles.data?.find((pr) => pr.id === p.patient_id);
    const dob = patient?.date_of_birth;
    const age = dob != null ? Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;
    return {
      id: p.id,
      started_at: p.started_at,
      care_plan: plan ? { id: plan.id, name: plan.name, slug: plan.slug, price_cents: plan.price_cents } : null,
      patient: patient ? { id: patient.id, full_name: patient.full_name, age, avatar_url: patient.avatar_url ?? null } : null,
    };
  });

  const mySponsors = plansWherePatient.map((p) => {
    const plan = carePlans.find((c) => c.id === p.care_plan_id);
    const sponsor = mySponsorProfiles.data?.find((pr) => pr.id === p.sponsor_id);
    return {
      id: p.id,
      started_at: p.started_at,
      care_plan: plan ? { id: plan.id, name: plan.name } : null,
      sponsor: sponsor ? { id: sponsor.id, full_name: sponsor.full_name, avatar_url: sponsor.avatar_url ?? null } : null,
    };
  });

  res.json({
    linkedPatients,
    mySponsors,
    notifications,
    carePlans,
  });
}

export async function getSponsoredPatient(req: AuthRequest, res: Response): Promise<void> {
  const linkId = req.params.id;
  const supabase = createSupabaseForUser(req.accessToken);
  const userId = req.user.id;

  const { data: link, error: linkError } = await supabase
    .from("sponsor_patient_plans")
    .select("id, patient_id, care_plan_id, started_at")
    .eq("id", linkId)
    .eq("sponsor_id", userId)
    .is("ended_at", null)
    .single();

  if (linkError || !link) {
    res.status(404).json({ error: "Not found." });
    return;
  }

  const [patientRes, planRes, metricsRes, appointmentsRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, date_of_birth, avatar_url").eq("id", link.patient_id).single(),
    supabase.from("care_plans").select("id, name, slug, price_cents").eq("id", link.care_plan_id).single(),
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
      .limit(20),
  ]);

  const clinicianIds = [...new Set((appointmentsRes.data ?? []).map((a) => a.clinician_id).filter(Boolean))];
  const { data: clinicianProfiles } =
    clinicianIds.length > 0 ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", clinicianIds) : { data: [] };

  const appointments = (appointmentsRes.data ?? []).map((a) => {
    const clinician = clinicianProfiles?.find((p) => p.id === a.clinician_id);
    return {
      ...a,
      clinician_name: clinician?.full_name ?? null,
      clinician_avatar_url: clinician?.avatar_url ?? null,
    };
  });

  res.json({
    link: { id: link.id, started_at: link.started_at, care_plan_id: link.care_plan_id, patient_id: link.patient_id },
    patient: patientRes.data ?? null,
    carePlan: planRes.data ?? null,
    metrics: metricsRes.data ?? [],
    appointments,
  });
}

export async function getHomeAppointments(req: AuthRequest, res: Response): Promise<void> {
  const supabase = createSupabaseForUser(req.accessToken);
  const userId = req.user.id;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
  const isStaff = profile?.role === "clinician" || profile?.role === "admin";

  let appointments: { id: string; patient_id: string; clinician_id: string; scheduled_at: string; status: string }[];
  if (isStaff) {
    const { data } = await supabase
      .from("appointments")
      .select("id, patient_id, clinician_id, scheduled_at, status")
      .order("scheduled_at", { ascending: false })
      .limit(100);
    appointments = data ?? [];
  } else {
    const { data } = await supabase
      .from("appointments")
      .select("id, patient_id, clinician_id, scheduled_at, status")
      .eq("patient_id", userId)
      .order("scheduled_at", { ascending: false });
    appointments = data ?? [];
  }

  const patientIds = [...new Set(appointments.map((a) => a.patient_id))];
  const clinicianIds = [...new Set(appointments.map((a) => a.clinician_id))];
  const [patientProfiles, clinicianProfiles] = await Promise.all([
    patientIds.length ? supabase.from("profiles").select("id, full_name, avatar_url").in("id", patientIds) : { data: [] },
    clinicianIds.length ? supabase.from("profiles").select("id, full_name").in("id", clinicianIds) : { data: [] },
  ]);

  const list = appointments.map((a) => ({
    ...a,
    patient_name: patientProfiles.data?.find((p) => p.id === a.patient_id)?.full_name ?? null,
    clinician_name: clinicianProfiles.data?.find((p) => p.id === a.clinician_id)?.full_name ?? null,
  }));

  res.json({ appointments: list });
}

export async function getHomeAppointmentById(req: AuthRequest, res: Response): Promise<void> {
  const appointmentId = req.params.id;
  const supabase = createSupabaseForUser(req.accessToken);
  const userId = req.user.id;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
  const isStaff = profile?.role === "clinician" || profile?.role === "admin";

  const { data: appointment, error } = await supabase
    .from("appointments")
    .select("id, patient_id, clinician_id, scheduled_at, status")
    .eq("id", appointmentId)
    .single();

  if (error || !appointment) {
    res.status(404).json({ error: "Appointment not found." });
    return;
  }

  if (!isStaff && appointment.patient_id !== userId) {
    res.status(403).json({ error: "Not authorized." });
    return;
  }

  const [patientRes, clinicianRes, notesRes, servicesRes, metricsRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, avatar_url").eq("id", appointment.patient_id).single(),
    supabase.from("profiles").select("id, full_name, avatar_url").eq("id", appointment.clinician_id).single(),
    supabase.from("appointment_notes").select("id, content, created_at").eq("appointment_id", appointmentId).order("created_at", { ascending: false }),
    supabase.from("appointment_services").select("id, service_type, details, created_at").eq("appointment_id", appointmentId).order("created_at", { ascending: false }),
    isStaff
      ? supabase
          .from("patient_metrics")
          .select("id, recorded_at, blood_pressure_systolic, blood_pressure_diastolic, weight_kg, a1c, medication_adherence")
          .eq("patient_id", appointment.patient_id)
          .order("recorded_at", { ascending: false })
          .limit(10)
      : { data: [] },
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
