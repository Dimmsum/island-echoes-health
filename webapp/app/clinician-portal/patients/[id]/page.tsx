import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchApiJson } from "@/lib/api";
import { PatientChartClient } from "./PatientChartClient";
import type { FollowUp } from "../../follow-up-types";
import type { StatusUpdate } from "../../status-update-types";
import type { PatientCondition } from "../../condition-types";
import type { Medication } from "../../medication-types";
import type { LabResult } from "../../lab-result-types";
import type {
  PatientAppointment,
  PatientNote,
  PatientWallet,
  SponsorLink,
  VitalsReading,
} from "./patient-chart-types";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ClinicianPortalPatientChartPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/clinician");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, avatar_url")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "clinician" && profile?.role !== "admin") redirect("/home");
  const role = profile.role as "clinician" | "admin";

  const { data: patient, error: patientError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, date_of_birth, phone")
    .eq("id", id)
    .single();

  if (patientError || !patient) redirect("/clinician-portal/patients");

  const [
    { data: appointmentRows },
    { data: metricRows },
    { data: sponsorRows },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, scheduled_at, status, appointment_type")
      .eq("patient_id", id)
      .order("scheduled_at", { ascending: false }),
    supabase
      .from("patient_metrics")
      .select(
        "id, recorded_at, blood_pressure_systolic, blood_pressure_diastolic, weight_kg, a1c, heart_rate_bpm, temperature_c",
      )
      .eq("patient_id", id)
      .order("recorded_at", { ascending: false })
      .limit(10),
    supabase
      .from("sponsor_patient_plans")
      .select("sponsor_id, started_at")
      .eq("patient_id", id)
      .is("ended_at", null),
  ]);

  const sponsorIds = [...new Set((sponsorRows ?? []).map((s) => s.sponsor_id))];
  const { data: sponsorProfiles } = sponsorIds.length
    ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", sponsorIds)
    : { data: [] as { id: string; full_name: string | null; avatar_url: string | null }[] };

  const appointments: PatientAppointment[] = (appointmentRows ?? []).map((a) => ({
    id: a.id,
    scheduledAt: a.scheduled_at,
    status: a.status,
    appointmentType: a.appointment_type,
  }));

  const now = new Date();
  const pastAppointments = appointments.filter(
    (a) => (a.status === "completed" || a.status === "no_show") && new Date(a.scheduledAt) <= now,
  );
  const lastAppointment = pastAppointments[0] ?? null;
  const nextAppointment =
    [...appointments]
      .filter((a) => a.status === "scheduled" && new Date(a.scheduledAt) >= now)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0] ?? null;

  const latestMetricWithBp = (metricRows ?? []).find(
    (m) => m.blood_pressure_systolic != null && m.blood_pressure_diastolic != null,
  );
  const latestBp = latestMetricWithBp
    ? {
        systolic: latestMetricWithBp.blood_pressure_systolic as number,
        diastolic: latestMetricWithBp.blood_pressure_diastolic as number,
        recordedAt: latestMetricWithBp.recorded_at as string,
      }
    : null;

  const vitalsHistory: VitalsReading[] = (metricRows ?? []).map((m) => ({
    id: m.id,
    recordedAt: m.recorded_at,
    systolic: m.blood_pressure_systolic,
    diastolic: m.blood_pressure_diastolic,
    weightKg: m.weight_kg,
    a1c: m.a1c,
    heartRateBpm: m.heart_rate_bpm,
    temperatureC: m.temperature_c,
  }));
  const latestWeightMetric = (metricRows ?? []).find((m) => m.weight_kg != null);
  const latestA1cMetric = (metricRows ?? []).find((m) => m.a1c != null);
  const latestWeightKg = latestWeightMetric?.weight_kg ?? null;
  const latestA1c = latestA1cMetric?.a1c ?? null;

  const sponsors: SponsorLink[] = (sponsorRows ?? []).map((s) => {
    const linkedProfile = (sponsorProfiles ?? []).find((p) => p.id === s.sponsor_id);
    return {
      sponsorId: s.sponsor_id,
      sponsorName: linkedProfile?.full_name ?? null,
      sponsorAvatarUrl: linkedProfile?.avatar_url ?? null,
      startedAt: s.started_at,
    };
  });

  let followUps: FollowUp[] = [];
  let statusUpdates: StatusUpdate[] = [];
  let conditions: PatientCondition[] = [];
  let medications: Medication[] = [];
  let labResults: LabResult[] = [];
  let notes: PatientNote[] = [];
  let wallet: PatientWallet | null = null;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.access_token) {
    const token = session.access_token;
    [followUps, statusUpdates, conditions, medications, labResults, notes, wallet] =
      await Promise.all([
        fetchApiJson<{ followUps: FollowUp[] }>(token, `/api/follow-ups?patientId=${id}`)
          .then((d) => d.followUps)
          .catch(() => []),
        fetchApiJson<{ statusUpdates: StatusUpdate[] }>(token, `/api/patients/${id}/status-updates`)
          .then((d) => d.statusUpdates)
          .catch(() => []),
        fetchApiJson<{ conditions: PatientCondition[] }>(token, `/api/patients/${id}/conditions`)
          .then((d) => d.conditions)
          .catch(() => []),
        fetchApiJson<{ medications: Medication[] }>(token, `/api/patients/${id}/medications`)
          .then((d) => d.medications)
          .catch(() => []),
        fetchApiJson<{ labResults: LabResult[] }>(token, `/api/patients/${id}/labs`)
          .then((d) => d.labResults)
          .catch(() => []),
        fetchApiJson<{ notes: PatientNote[] }>(token, `/api/patients/${id}/notes`)
          .then((d) => d.notes)
          .catch(() => []),
        fetchApiJson<{ wallet: PatientWallet }>(token, `/api/wallet?patientId=${id}`)
          .then((d) => d.wallet)
          .catch(() => null),
      ]);
  }

  return (
    <PatientChartClient
      clinicianName={profile.full_name ?? null}
      clinicianAvatarUrl={profile.avatar_url ?? null}
      role={role}
      patientId={id}
      patientName={patient.full_name ?? null}
      patientAvatarUrl={patient.avatar_url ?? null}
      dateOfBirth={patient.date_of_birth ?? null}
      phone={patient.phone ?? null}
      appointments={appointments}
      lastAppointment={lastAppointment}
      nextAppointment={nextAppointment}
      latestBp={latestBp}
      latestWeightKg={latestWeightKg}
      latestA1c={latestA1c}
      vitalsHistory={vitalsHistory}
      sponsors={sponsors}
      followUps={followUps}
      statusUpdates={statusUpdates}
      conditions={conditions}
      medications={medications}
      labResults={labResults}
      notes={notes}
      wallet={wallet}
    />
  );
}
