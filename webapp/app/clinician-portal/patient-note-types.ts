export type NoteType = "general" | "coordination" | "clinical_summary" | "discharge";

/** Mirrors the camelCase shape returned by GET /api/patients/:id/notes. */
export type PatientNote = {
  id: string;
  appointmentId: string;
  appointmentDate: string | null;
  content: string;
  noteType: NoteType;
  flagForFollowUp: boolean;
  createdAt: string;
};
