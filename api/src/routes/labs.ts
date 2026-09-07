import { Response } from "express";
import { createSupabaseForUser, createClientAdmin } from "../lib/supabase.js";
import type { AuthRequest } from "../middleware/auth.js";

const LAB_PANEL_TYPES = ["lipid_panel", "metabolic_panel", "other"] as const;
type LabPanelType = (typeof LAB_PANEL_TYPES)[number];

type LabResultRow = {
  id: string;
  patient_id: string;
  panel_type: LabPanelType;
  test_name: string;
  value: number;
  unit: string | null;
  reference_low: number | null;
  reference_high: number | null;
  drawn_at: string;
  created_by: string;
  created_at: string;
};

const ROW_COLUMNS =
  "id, patient_id, panel_type, test_name, value, unit, reference_low, reference_high, drawn_at, created_by, created_at";

function mapLabResult(row: LabResultRow) {
  return {
    id: row.id,
    patientId: row.patient_id,
    panelType: row.panel_type,
    testName: row.test_name,
    value: row.value,
    unit: row.unit,
    referenceLow: row.reference_low,
    referenceHigh: row.reference_high,
    drawnAt: row.drawn_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

/**
 * POST /api/patients/:id/labs
 * Body: { panelType, testName, value, unit?, referenceLow?, referenceHigh?, drawnAt }
 * Clinician (or admin) records a lab result for a patient. Writes go through
 * the service-role client since lab_results has no authenticated-write RLS policy.
 * Immutable — no update route; corrections are new entries.
 */
export async function createLabResult(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const userId = req.user.id;
  const patientId = req.params.id as string;
  const {
    panelType,
    testName,
    value,
    unit,
    referenceLow,
    referenceHigh,
    drawnAt,
  } = req.body as {
    panelType?: string;
    testName?: string;
    value?: number;
    unit?: string;
    referenceLow?: number;
    referenceHigh?: number;
    drawnAt?: string;
  };

  if (!testName || !testName.trim()) {
    res.status(400).json({ error: "testName is required." });
    return;
  }
  if (!panelType || !LAB_PANEL_TYPES.includes(panelType as LabPanelType)) {
    res.status(400).json({ error: "Invalid panelType value." });
    return;
  }
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    res.status(400).json({ error: "value is required and must be numeric." });
    return;
  }
  if (!drawnAt || Number.isNaN(Date.parse(drawnAt))) {
    res.status(400).json({ error: "drawnAt is required and must be a valid date." });
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

  const { data: labResult, error } = await admin
    .from("lab_results")
    .insert({
      patient_id: patientId,
      created_by: userId,
      panel_type: panelType,
      test_name: testName.trim(),
      value,
      unit: unit?.trim() || null,
      reference_low: referenceLow ?? null,
      reference_high: referenceHigh ?? null,
      drawn_at: drawnAt,
    })
    .select(ROW_COLUMNS)
    .single();

  if (error || !labResult) {
    res.status(500).json({ error: "Failed to create lab result." });
    return;
  }

  res
    .status(201)
    .json({ labResult: mapLabResult(labResult as LabResultRow) });
}

/**
 * GET /api/patients/:id/labs
 * Reads through the user-context client so RLS enforces who can see it: the
 * patient sees their own, a linked sponsor sees theirs, and clinicians/admins
 * see all. Ordered by drawn_at (clinically relevant time), not entry time.
 */
export async function listLabResults(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const patientId = req.params.id;

  const supabase = createSupabaseForUser(req.accessToken);

  const { data: rows, error } = await supabase
    .from("lab_results")
    .select(ROW_COLUMNS)
    .eq("patient_id", patientId)
    .order("drawn_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: "Failed to load lab results." });
    return;
  }

  res.json({
    labResults: (rows ?? []).map((r) => mapLabResult(r as LabResultRow)),
  });
}
