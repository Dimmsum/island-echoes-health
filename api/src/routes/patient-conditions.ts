import { Response } from "express";
import { createSupabaseForUser, createClientAdmin } from "../lib/supabase.js";
import type { AuthRequest } from "../middleware/auth.js";

const CONDITION_TYPES = ["condition", "allergy"] as const;
type ConditionType = (typeof CONDITION_TYPES)[number];

type ConditionRow = {
  id: string;
  patient_id: string;
  label: string;
  type: ConditionType;
  severity: string | null;
  created_by: string;
  created_at: string;
};

const ROW_COLUMNS = "id, patient_id, label, type, severity, created_by, created_at";

function mapCondition(row: ConditionRow) {
  return {
    id: row.id,
    patientId: row.patient_id,
    label: row.label,
    type: row.type,
    severity: row.severity,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

/**
 * POST /api/patients/:id/conditions
 * Body: { label, type, severity? }
 * Clinician (or admin) records a condition or allergy for a patient. Writes go
 * through the service-role client since patient_conditions has no
 * authenticated-write RLS policy.
 */
export async function createCondition(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const userId = req.user.id;
  const patientId = req.params.id as string;
  const { label, type, severity } = req.body as {
    label?: string;
    type?: string;
    severity?: string;
  };

  if (!label || !label.trim()) {
    res.status(400).json({ error: "label is required." });
    return;
  }
  if (!type || !CONDITION_TYPES.includes(type as ConditionType)) {
    res.status(400).json({ error: "Invalid type value." });
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

  const { data: condition, error } = await admin
    .from("patient_conditions")
    .insert({
      patient_id: patientId,
      created_by: userId,
      label: label.trim(),
      type: type as ConditionType,
      severity: severity?.trim() || null,
    })
    .select(ROW_COLUMNS)
    .single();

  if (error || !condition) {
    res.status(500).json({ error: "Failed to create condition." });
    return;
  }

  res.status(201).json({ condition: mapCondition(condition as ConditionRow) });
}

/**
 * GET /api/patients/:id/conditions
 * Reads through the user-context client so RLS enforces who can see it: the
 * patient sees their own, a linked sponsor sees theirs, and clinicians/admins
 * see all. No service-role read — RLS does the scoping.
 */
export async function listConditions(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const patientId = req.params.id;

  const supabase = createSupabaseForUser(req.accessToken);

  const { data: rows, error } = await supabase
    .from("patient_conditions")
    .select(ROW_COLUMNS)
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: "Failed to load conditions." });
    return;
  }

  res.json({
    conditions: (rows ?? []).map((r) => mapCondition(r as ConditionRow)),
  });
}
