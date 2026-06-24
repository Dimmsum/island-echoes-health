export type FollowUpStatus = "pending" | "completed" | "cancelled";

/** Mirrors the camelCase shape returned by GET /api/follow-ups. */
export type FollowUp = {
  id: string;
  patientId: string;
  clinicianId: string;
  appointmentId: string | null;
  dueDate: string;
  status: FollowUpStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  overdue: boolean;
};
