"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClientAdmin } from "@/lib/supabase/admin";

export type ClinicianActionResult = { error: string | null };

async function ensureClinicianOrAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in.", userId: null as unknown as string };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = profile?.role;
  if (role !== "clinician" && role !== "admin") {
    return { error: "Not authorized.", userId: null as unknown as string };
  }
  return { error: null, userId: user.id };
}

async function notifySponsorsOfPatient(
  patientId: string,
  type: "visit_update" | "no_show_alert",
  title: string,
  body: string
) {
  const admin = createClientAdmin();
  const { data: links } = await admin
    .from("sponsor_patient_plans")
    .select("sponsor_id")
    .eq("patient_id", patientId)
    .is("ended_at", null);
  if (!links?.length) return;
  for (const { sponsor_id } of links) {
    await admin.from("notifications").insert({
      user_id: sponsor_id,
      type,
      title,
      body,
    });
  }
}

export async function createAppointment(
  patientId: string,
  scheduledAt: string
): Promise<ClinicianActionResult> {
  const { error, userId } = await ensureClinicianOrAdmin();
  if (error || !userId) return { error: error ?? "Not signed in." };

  const supabase = await createClient();
  const { error: insertError } = await supabase.from("appointments").insert({
    patient_id: patientId,
    clinician_id: userId,
    scheduled_at: scheduledAt,
    status: "scheduled",
  });

  if (insertError) {
    console.error("Create appointment failed:", insertError);
    return { error: "Failed to create appointment." };
  }

  revalidatePath("/home");
  revalidatePath("/home/appointments");
  revalidatePath("/clinician-portal");
  revalidatePath("/clinician-portal/appointments");
  return { error: null };
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: "scheduled" | "completed" | "no_show" | "cancelled"
): Promise<ClinicianActionResult> {
  const { error, userId } = await ensureClinicianOrAdmin();
  if (error || !userId) return { error: error ?? "Not signed in." };

  const supabase = await createClient();
  const { data: apt } = await supabase
    .from("appointments")
    .select("id, patient_id, scheduled_at")
    .eq("id", appointmentId)
    .single();

  if (!apt) return { error: "Appointment not found." };

  const { error: updateError } = await supabase
    .from("appointments")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", appointmentId);

  if (updateError) {
    console.error("Update appointment failed:", updateError);
    return { error: "Failed to update." };
  }

  const dateStr = new Date(apt.scheduled_at).toLocaleDateString();
  if (status === "no_show") {
    await notifySponsorsOfPatient(
      apt.patient_id,
      "no_show_alert",
      "No-show alert",
      `A patient had a scheduled visit on ${dateStr} and did not show up.`
    );
  }
  if (status === "completed") {
    await notifySponsorsOfPatient(
      apt.patient_id,
      "visit_update",
      "Visit completed",
      `A scheduled visit on ${dateStr} was completed. Check the visit summary for details.`
    );
  }

  revalidatePath("/home");
  revalidatePath("/home/appointments");
  revalidatePath("/clinician-portal");
  revalidatePath("/clinician-portal/appointments");
  return { error: null };
}

export async function rescheduleAppointment(
  appointmentId: string,
  scheduledAt: string
): Promise<ClinicianActionResult> {
  const { error } = await ensureClinicianOrAdmin();
  if (error) return { error };

  const supabase = await createClient();
  const { error: updateError } = await supabase
    .from("appointments")
    .update({ scheduled_at: scheduledAt, updated_at: new Date().toISOString() })
    .eq("id", appointmentId);

  if (updateError) {
    console.error("Reschedule failed:", updateError);
    return { error: "Failed to reschedule." };
  }

  revalidatePath("/home");
  revalidatePath("/home/appointments");
  revalidatePath("/clinician-portal");
  revalidatePath("/clinician-portal/appointments");
  return { error: null };
}

export async function addAppointmentNote(
  appointmentId: string,
  content: string
): Promise<ClinicianActionResult> {
  const { error, userId } = await ensureClinicianOrAdmin();
  if (error || !userId) return { error: error ?? "Not signed in." };

  const supabase = await createClient();
  const { error: insertError } = await supabase.from("appointment_notes").insert({
    appointment_id: appointmentId,
    content: content.trim(),
    created_by: userId,
  });

  if (insertError) {
    console.error("Add note failed:", insertError);
    return { error: "Failed to add note." };
  }

  revalidatePath("/home/appointments");
  revalidatePath("/home/appointments/" + appointmentId);
  revalidatePath("/clinician-portal/appointments");
  revalidatePath("/clinician-portal/appointments/" + appointmentId);
  return { error: null };
}

const SERVICE_TYPES = [
  "vitals",
  "chronic_lab",
  "wellness_check",
  "follow_up",
  "coordination",
] as const;

export async function addAppointmentService(
  appointmentId: string,
  serviceType: string,
  details?: string
): Promise<ClinicianActionResult> {
  const { error } = await ensureClinicianOrAdmin();
  if (error) return { error };
  if (!SERVICE_TYPES.includes(serviceType as (typeof SERVICE_TYPES)[number])) {
    return { error: "Invalid service type." };
  }

  const supabase = await createClient();
  const { error: insertError } = await supabase.from("appointment_services").insert({
    appointment_id: appointmentId,
    service_type: serviceType as (typeof SERVICE_TYPES)[number],
    details: details?.trim() || null,
  });

  if (insertError) {
    console.error("Add service failed:", insertError);
    return { error: "Failed to add service." };
  }

  revalidatePath("/home/appointments");
  revalidatePath("/home/appointments/" + appointmentId);
  revalidatePath("/clinician-portal/appointments");
  revalidatePath("/clinician-portal/appointments/" + appointmentId);
  return { error: null };
}

export async function recordPatientMetrics(params: {
  patientId: string;
  appointmentId: string | null;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  weightKg?: number;
  a1c?: number;
  medicationAdherence?: "good" | "fair" | "poor";
}): Promise<ClinicianActionResult> {
  const { error, userId } = await ensureClinicianOrAdmin();
  if (error || !userId) return { error: error ?? "Not signed in." };

  const supabase = await createClient();
  const { error: insertError } = await supabase.from("patient_metrics").insert({
    patient_id: params.patientId,
    appointment_id: params.appointmentId,
    recorded_by: userId,
    blood_pressure_systolic: params.bloodPressureSystolic ?? null,
    blood_pressure_diastolic: params.bloodPressureDiastolic ?? null,
    weight_kg: params.weightKg ?? null,
    a1c: params.a1c ?? null,
    medication_adherence: params.medicationAdherence ?? null,
  });

  if (insertError) {
    console.error("Record metrics failed:", insertError);
    return { error: "Failed to record metrics." };
  }

  revalidatePath("/home/appointments");
  revalidatePath("/home/appointments/" + params.appointmentId);
  revalidatePath("/clinician-portal/appointments");
  revalidatePath("/clinician-portal/appointments/" + params.appointmentId);
  return { error: null };
}
