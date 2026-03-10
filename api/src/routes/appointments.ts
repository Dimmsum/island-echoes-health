import { Response } from "express";
import { createSupabaseForUser } from "../lib/supabase.js";
import { notifySponsorsOfPatient } from "../lib/notifications.js";
import type { AuthRequest } from "../middleware/auth.js";

const SERVICE_TYPES = ["vitals", "chronic_lab", "wellness_check", "follow_up", "coordination"] as const;

export async function createAppointment(req: AuthRequest, res: Response): Promise<void> {
  const supabase = createSupabaseForUser(req.accessToken);
  const userId = req.user.id;
  const { patientId, scheduledAt } = req.body as { patientId?: string; scheduledAt?: string };
  if (!patientId || !scheduledAt) {
    res.status(400).json({ error: "patientId and scheduledAt are required." });
    return;
  }

  const { error: insertError } = await supabase.from("appointments").insert({
    patient_id: patientId,
    clinician_id: userId,
    scheduled_at: scheduledAt,
    status: "scheduled",
  });

  if (insertError) {
    res.status(500).json({ error: "Failed to create appointment." });
    return;
  }
  res.status(201).json({ error: null });
}

export async function updateAppointmentStatus(req: AuthRequest, res: Response): Promise<void> {
  const supabase = createSupabaseForUser(req.accessToken);
  const appointmentId = req.params.id;
  const { status } = req.body as { status?: string };
  if (!status || !["scheduled", "completed", "no_show", "cancelled"].includes(status)) {
    res.status(400).json({ error: "Valid status is required." });
    return;
  }

  const { data: apt } = await supabase
    .from("appointments")
    .select("id, patient_id, scheduled_at")
    .eq("id", appointmentId)
    .single();

  if (!apt) {
    res.status(404).json({ error: "Appointment not found." });
    return;
  }

  const { error: updateError } = await supabase
    .from("appointments")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", appointmentId);

  if (updateError) {
    res.status(500).json({ error: "Failed to update." });
    return;
  }

  const dateStr = new Date(apt.scheduled_at).toLocaleDateString();
  if (status === "no_show") {
    await notifySponsorsOfPatient(apt.patient_id, "no_show_alert", "No-show alert", `A patient had a scheduled visit on ${dateStr} and did not show up.`);
  }
  if (status === "completed") {
    await notifySponsorsOfPatient(apt.patient_id, "visit_update", "Visit completed", `A scheduled visit on ${dateStr} was completed. Check the visit summary for details.`);
  }

  res.json({ error: null });
}

export async function rescheduleAppointment(req: AuthRequest, res: Response): Promise<void> {
  const supabase = createSupabaseForUser(req.accessToken);
  const appointmentId = req.params.id;
  const { scheduledAt } = req.body as { scheduledAt?: string };
  if (!scheduledAt) {
    res.status(400).json({ error: "scheduledAt is required." });
    return;
  }

  const { error } = await supabase
    .from("appointments")
    .update({ scheduled_at: scheduledAt, updated_at: new Date().toISOString() })
    .eq("id", appointmentId);

  if (error) {
    res.status(500).json({ error: "Failed to reschedule." });
    return;
  }
  res.json({ error: null });
}

export async function addNote(req: AuthRequest, res: Response): Promise<void> {
  const supabase = createSupabaseForUser(req.accessToken);
  const appointmentId = req.params.id;
  const userId = req.user.id;
  const { content } = req.body as { content?: string };
  if (!content?.trim()) {
    res.status(400).json({ error: "content is required." });
    return;
  }

  const { error } = await supabase.from("appointment_notes").insert({
    appointment_id: appointmentId,
    content: content.trim(),
    created_by: userId,
  });

  if (error) {
    res.status(500).json({ error: "Failed to add note." });
    return;
  }
  res.status(201).json({ error: null });
}

export async function addService(req: AuthRequest, res: Response): Promise<void> {
  const supabase = createSupabaseForUser(req.accessToken);
  const appointmentId = req.params.id;
  const { serviceType, details } = req.body as { serviceType?: string; details?: string };
  if (!serviceType || !SERVICE_TYPES.includes(serviceType as (typeof SERVICE_TYPES)[number])) {
    res.status(400).json({ error: "Valid serviceType is required." });
    return;
  }

  const { error } = await supabase.from("appointment_services").insert({
    appointment_id: appointmentId,
    service_type: serviceType as (typeof SERVICE_TYPES)[number],
    details: details?.trim() || null,
  });

  if (error) {
    res.status(500).json({ error: "Failed to add service." });
    return;
  }
  res.status(201).json({ error: null });
}

export async function recordMetrics(req: AuthRequest, res: Response): Promise<void> {
  const supabase = createSupabaseForUser(req.accessToken);
  const appointmentId = req.params.id;
  const userId = req.user.id;
  const body = req.body as {
    patientId?: string;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    weightKg?: number;
    a1c?: number;
    medicationAdherence?: "good" | "fair" | "poor";
  };
  if (!body.patientId) {
    res.status(400).json({ error: "patientId is required." });
    return;
  }

  const { error } = await supabase.from("patient_metrics").insert({
    patient_id: body.patientId,
    appointment_id: appointmentId || null,
    recorded_by: userId,
    blood_pressure_systolic: body.bloodPressureSystolic ?? null,
    blood_pressure_diastolic: body.bloodPressureDiastolic ?? null,
    weight_kg: body.weightKg ?? null,
    a1c: body.a1c ?? null,
    medication_adherence: body.medicationAdherence ?? null,
  });

  if (error) {
    res.status(500).json({ error: "Failed to record metrics." });
    return;
  }
  res.status(201).json({ error: null });
}
