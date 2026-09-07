import { Response } from "express";
import { createSupabaseForUser, createClientAdmin } from "../lib/supabase.js";
import type { AuthRequest } from "../middleware/auth.js";

type MedicationRow = {
  id: string;
  patient_id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  prescribed_by: string | null;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
};

const ROW_COLUMNS =
  "id, patient_id, name, dosage, frequency, prescribed_by, started_at, ended_at, notes, created_by, created_at";

function mapMedication(row: MedicationRow) {
  return {
    id: row.id,
    patientId: row.patient_id,
    name: row.name,
    dosage: row.dosage,
    frequency: row.frequency,
    prescribedBy: row.prescribed_by,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    notes: row.notes,
    active: row.ended_at === null,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

/**
 * POST /api/patients/:id/medications
 * Body: { name, dosage?, frequency?, prescribedBy?, startedAt?, notes? }
 * Clinician (or admin) records a medication for a patient. Writes go through
 * the service-role client since medications has no authenticated-write RLS policy.
 */
export async function createMedication(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const userId = req.user.id;
  const patientId = req.params.id as string;
  const { name, dosage, frequency, prescribedBy, startedAt, notes } =
    req.body as {
      name?: string;
      dosage?: string;
      frequency?: string;
      prescribedBy?: string;
      startedAt?: string;
      notes?: string;
    };

  if (!name || !name.trim()) {
    res.status(400).json({ error: "name is required." });
    return;
  }
  if (startedAt && Number.isNaN(Date.parse(startedAt))) {
    res.status(400).json({ error: "startedAt must be a valid date." });
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

  const { data: medication, error } = await admin
    .from("medications")
    .insert({
      patient_id: patientId,
      created_by: userId,
      name: name.trim(),
      dosage: dosage?.trim() || null,
      frequency: frequency?.trim() || null,
      prescribed_by: prescribedBy?.trim() || null,
      started_at: startedAt ?? new Date().toISOString().slice(0, 10),
      notes: notes?.trim() || null,
    })
    .select(ROW_COLUMNS)
    .single();

  if (error || !medication) {
    res.status(500).json({ error: "Failed to create medication." });
    return;
  }

  res
    .status(201)
    .json({ medication: mapMedication(medication as MedicationRow) });
}

/**
 * GET /api/patients/:id/medications
 * Reads through the user-context client so RLS enforces who can see it: the
 * patient sees their own, a linked sponsor sees theirs, and clinicians/admins
 * see all. No service-role read — RLS does the scoping.
 */
export async function listMedications(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const patientId = req.params.id;

  const supabase = createSupabaseForUser(req.accessToken);

  const { data: rows, error } = await supabase
    .from("medications")
    .select(ROW_COLUMNS)
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: "Failed to load medications." });
    return;
  }

  res.json({
    medications: (rows ?? []).map((r) => mapMedication(r as MedicationRow)),
  });
}

/**
 * PATCH /api/patients/:id/medications/:medicationId
 * Body: { dosage?, frequency?, notes?, endedAt? }
 * Only the recording clinician (or an admin) may update. Primarily used to end
 * a medication by setting endedAt.
 */
export async function updateMedication(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const userId = req.user.id;
  const medicationId = req.params.medicationId;
  const { dosage, frequency, notes, endedAt } = req.body as {
    dosage?: string;
    frequency?: string;
    notes?: string;
    endedAt?: string | null;
  };

  if (
    dosage === undefined &&
    frequency === undefined &&
    notes === undefined &&
    endedAt === undefined
  ) {
    res
      .status(400)
      .json({ error: "Provide at least one field to update." });
    return;
  }
  if (endedAt && Number.isNaN(Date.parse(endedAt))) {
    res.status(400).json({ error: "endedAt must be a valid date." });
    return;
  }

  const admin = createClientAdmin();

  const { data: existing } = await admin
    .from("medications")
    .select("id, created_by")
    .eq("id", medicationId)
    .maybeSingle();

  if (!existing) {
    res.status(404).json({ error: "Medication not found." });
    return;
  }

  const { data: caller } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  const isOwner = existing.created_by === userId;
  const isAdmin = caller?.role === "admin";
  if (!isOwner && !isAdmin) {
    res.status(403).json({ error: "You cannot update this medication." });
    return;
  }

  const update: Record<string, unknown> = {};
  if (dosage !== undefined) update.dosage = dosage.trim() || null;
  if (frequency !== undefined) update.frequency = frequency.trim() || null;
  if (notes !== undefined) update.notes = notes.trim() || null;
  if (endedAt !== undefined) update.ended_at = endedAt || null;

  const { data: updated, error } = await admin
    .from("medications")
    .update(update)
    .eq("id", medicationId)
    .select(ROW_COLUMNS)
    .single();

  if (error || !updated) {
    res.status(500).json({ error: "Failed to update medication." });
    return;
  }

  res.json({ medication: mapMedication(updated as MedicationRow) });
}
