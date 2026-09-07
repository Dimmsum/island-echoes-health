import { Response } from "express";
import { createSupabaseForUser } from "../lib/supabase.js";
import type { AuthRequest } from "../middleware/auth.js";

type NoteRow = {
  id: string;
  appointment_id: string;
  content: string;
  note_type: string;
  flag_for_follow_up: boolean;
  created_at: string;
};

/**
 * GET /api/patients/:id/notes
 * Aggregates appointment_notes across all of a patient's appointments into one
 * chronological feed. Reads through the user-context client (RLS-scoped, not
 * admin) in two steps: first the patient's appointments, then notes for those
 * appointments — the second query is what enforces appointment_notes' existing
 * RLS, which already excludes "coordination" notes from sponsors.
 */
export async function listPatientNotes(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const patientId = req.params.id;
  const supabase = createSupabaseForUser(req.accessToken);

  const { data: appts, error: apptError } = await supabase
    .from("appointments")
    .select("id, scheduled_at")
    .eq("patient_id", patientId);

  if (apptError) {
    res.status(500).json({ error: "Failed to load notes." });
    return;
  }

  const appointmentIds = (appts ?? []).map((a) => a.id as string);
  if (appointmentIds.length === 0) {
    res.json({ notes: [] });
    return;
  }
  const scheduledById = new Map(
    (appts ?? []).map((a) => [a.id as string, a.scheduled_at as string]),
  );

  const { data: rows, error } = await supabase
    .from("appointment_notes")
    .select("id, appointment_id, content, note_type, flag_for_follow_up, created_at")
    .in("appointment_id", appointmentIds)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: "Failed to load notes." });
    return;
  }

  res.json({
    notes: (rows ?? []).map((r) => {
      const row = r as NoteRow;
      return {
        id: row.id,
        appointmentId: row.appointment_id,
        appointmentDate: scheduledById.get(row.appointment_id) ?? null,
        content: row.content,
        noteType: row.note_type,
        flagForFollowUp: row.flag_for_follow_up,
        createdAt: row.created_at,
      };
    }),
  });
}
