import { Response } from "express";
import { createSupabaseForUser, createClientAdmin } from "../lib/supabase.js";
import type { AuthRequest } from "../middleware/auth.js";

const FOLLOW_UP_STATUSES = ["pending", "completed", "cancelled"] as const;
type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];

type FollowUpRow = {
  id: string;
  patient_id: string;
  clinician_id: string;
  appointment_id: string | null;
  due_date: string;
  status: FollowUpStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

const ROW_COLUMNS =
  "id, patient_id, clinician_id, appointment_id, due_date, status, notes, created_at, updated_at, completed_at";

// Today as YYYY-MM-DD for comparing against the DATE column.
function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function mapFollowUp(row: FollowUpRow) {
  return {
    id: row.id,
    patientId: row.patient_id,
    clinicianId: row.clinician_id,
    appointmentId: row.appointment_id,
    dueDate: row.due_date,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
    // "Overdue" is derived, never stored: a pending task past its due date.
    overdue: row.status === "pending" && row.due_date < todayDateString(),
  };
}

/**
 * POST /api/follow-ups
 * Body: { patientId, dueDate, notes?, appointmentId? }
 * Clinician (or admin) creates a follow-up task for a patient. Optionally linked
 * to a source appointment. Writes go through the service-role client since
 * follow_ups has no authenticated-write RLS policy.
 */
export async function createFollowUp(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const userId = req.user.id;
  const { patientId, dueDate, notes, appointmentId } = req.body as {
    patientId?: string;
    dueDate?: string;
    notes?: string;
    appointmentId?: string;
  };

  if (!patientId || !dueDate) {
    res.status(400).json({ error: "patientId and dueDate are required." });
    return;
  }
  if (Number.isNaN(Date.parse(dueDate))) {
    res.status(400).json({ error: "dueDate must be a valid date." });
    return;
  }

  const admin = createClientAdmin();

  // Confirm the target is a patient account.
  const { data: targetProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", patientId)
    .single();

  const STAFF_ROLES = ["clinician", "admin"];
  if (!targetProfile || STAFF_ROLES.includes(targetProfile.role)) {
    res.status(400).json({ error: "Target user is not a patient." });
    return;
  }

  // If linked to an appointment, ensure it exists and belongs to the same patient.
  if (appointmentId) {
    const { data: apt } = await admin
      .from("appointments")
      .select("id, patient_id")
      .eq("id", appointmentId)
      .maybeSingle();

    if (!apt || apt.patient_id !== patientId) {
      res
        .status(400)
        .json({ error: "appointmentId does not match this patient." });
      return;
    }
  }

  const { data: followUp, error } = await admin
    .from("follow_ups")
    .insert({
      patient_id: patientId,
      clinician_id: userId,
      appointment_id: appointmentId ?? null,
      due_date: dueDate,
      notes: notes?.trim() || null,
      status: "pending",
    })
    .select(ROW_COLUMNS)
    .single();

  if (error || !followUp) {
    res.status(500).json({ error: "Failed to create follow-up." });
    return;
  }

  res.status(201).json({ followUp: mapFollowUp(followUp as FollowUpRow) });
}

/**
 * GET /api/follow-ups
 * Query: ?patientId (optional filter), ?status (optional: pending|completed|cancelled)
 * Reads through the user-context client so RLS scopes the result automatically:
 * patient sees own, linked sponsor sees their patient's, clinician sees all.
 */
export async function listFollowUps(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const { patientId, status } = req.query as {
    patientId?: string;
    status?: string;
  };

  if (status && !FOLLOW_UP_STATUSES.includes(status as FollowUpStatus)) {
    res.status(400).json({ error: "Invalid status filter." });
    return;
  }

  const supabase = createSupabaseForUser(req.accessToken);

  let query = supabase
    .from("follow_ups")
    .select(ROW_COLUMNS)
    .order("due_date", { ascending: true })
    .limit(100);

  if (patientId) query = query.eq("patient_id", patientId);
  if (status) query = query.eq("status", status);

  const { data: rows, error } = await query;

  if (error) {
    res.status(500).json({ error: "Failed to load follow-ups." });
    return;
  }

  res.json({ followUps: (rows ?? []).map((r) => mapFollowUp(r as FollowUpRow)) });
}

/**
 * PATCH /api/follow-ups/:id
 * Body: { status?, notes? }
 * Only the owning clinician (or an admin) may update. Patients/sponsors are
 * read-only. completed_at is managed automatically on status transitions.
 */
export async function updateFollowUp(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const userId = req.user.id;
  const followUpId = req.params.id;
  const { status, notes } = req.body as { status?: string; notes?: string };

  if (status === undefined && notes === undefined) {
    res.status(400).json({ error: "Provide status and/or notes to update." });
    return;
  }
  if (status !== undefined && !FOLLOW_UP_STATUSES.includes(status as FollowUpStatus)) {
    res.status(400).json({ error: "Valid status is required." });
    return;
  }

  const admin = createClientAdmin();

  const { data: existing } = await admin
    .from("follow_ups")
    .select("id, clinician_id")
    .eq("id", followUpId)
    .maybeSingle();

  if (!existing) {
    res.status(404).json({ error: "Follow-up not found." });
    return;
  }

  // Ownership guard: only the creating clinician or an admin may update.
  const { data: caller } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  const isOwner = existing.clinician_id === userId;
  const isAdmin = caller?.role === "admin";
  if (!isOwner && !isAdmin) {
    res.status(403).json({ error: "You cannot update this follow-up." });
    return;
  }

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (notes !== undefined) update.notes = notes.trim() || null;
  if (status !== undefined) {
    update.status = status;
    // completed_at tracks the most recent completion; cleared if reopened.
    update.completed_at = status === "completed" ? new Date().toISOString() : null;
  }

  const { data: updated, error } = await admin
    .from("follow_ups")
    .update(update)
    .eq("id", followUpId)
    .select(ROW_COLUMNS)
    .single();

  if (error || !updated) {
    res.status(500).json({ error: "Failed to update follow-up." });
    return;
  }

  res.json({ followUp: mapFollowUp(updated as FollowUpRow) });
}
