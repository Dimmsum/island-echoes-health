import { Response } from "express";
import { createSupabaseForUser, createClientAdmin } from "../lib/supabase.js";
import type { AuthRequest } from "../middleware/auth.js";

const VISIBILITIES = ["all", "sponsor_only", "patient_only"] as const;
type StatusUpdateVisibility = (typeof VISIBILITIES)[number];

type StatusUpdateRow = {
  id: string;
  patient_id: string;
  created_by: string;
  status_text: string;
  visibility: StatusUpdateVisibility;
  created_at: string;
};

const ROW_COLUMNS =
  "id, patient_id, created_by, status_text, visibility, created_at";

function mapStatusUpdate(row: StatusUpdateRow) {
  return {
    id: row.id,
    patientId: row.patient_id,
    createdBy: row.created_by,
    statusText: row.status_text,
    visibility: row.visibility,
    createdAt: row.created_at,
  };
}

/**
 * POST /api/patients/:id/status-updates
 * Body: { statusText, visibility? }
 * Clinician (or admin) posts a status update about a patient. Writes go through
 * the service-role client since patient_status_updates has no authenticated-write
 * RLS policy. Visibility ('all' | 'sponsor_only' | 'patient_only') controls who
 * can later read it; defaults to 'all'.
 */
export async function createStatusUpdate(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const userId = req.user.id;
  const patientId = req.params.id;
  const { statusText, visibility } = req.body as {
    statusText?: string;
    visibility?: string;
  };

  if (!statusText || !statusText.trim()) {
    res.status(400).json({ error: "statusText is required." });
    return;
  }
  if (
    visibility !== undefined &&
    !VISIBILITIES.includes(visibility as StatusUpdateVisibility)
  ) {
    res.status(400).json({ error: "Invalid visibility value." });
    return;
  }

  const admin = createClientAdmin();

  // Confirm the target is a patient account.
  const { data: targetProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", patientId)
    .single();

  if (!targetProfile || targetProfile.role !== "patient") {
    res.status(400).json({ error: "Target user is not a patient." });
    return;
  }

  const { data: statusUpdate, error } = await admin
    .from("patient_status_updates")
    .insert({
      patient_id: patientId,
      created_by: userId,
      status_text: statusText.trim(),
      visibility: (visibility as StatusUpdateVisibility) ?? "all",
    })
    .select(ROW_COLUMNS)
    .single();

  if (error || !statusUpdate) {
    res.status(500).json({ error: "Failed to create status update." });
    return;
  }

  res
    .status(201)
    .json({ statusUpdate: mapStatusUpdate(statusUpdate as StatusUpdateRow) });
}

/**
 * GET /api/patients/:id/status-updates
 * Reads through the user-context client so RLS enforces the visibility views:
 * the patient sees own all/patient_only, a linked sponsor sees all/sponsor_only,
 * and a clinician sees all. No service-role read — the views are enforced here.
 */
export async function listStatusUpdates(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const patientId = req.params.id;

  const supabase = createSupabaseForUser(req.accessToken);

  const { data: rows, error } = await supabase
    .from("patient_status_updates")
    .select(ROW_COLUMNS)
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    res.status(500).json({ error: "Failed to load status updates." });
    return;
  }

  res.json({
    statusUpdates: (rows ?? []).map((r) =>
      mapStatusUpdate(r as StatusUpdateRow),
    ),
  });
}
