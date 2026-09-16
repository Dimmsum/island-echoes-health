/** Mirrors the `appointments` row shape, fetched directly via Supabase for one patient. */
export type PatientAppointment = {
  id: string;
  scheduledAt: string;
  status: "scheduled" | "completed" | "no_show" | "cancelled";
  appointmentType: string | null;
};

/** A patient's active sponsor, joined from sponsor_patient_plans + profiles. */
export type SponsorLink = {
  sponsorId: string;
  sponsorName: string | null;
  sponsorAvatarUrl: string | null;
  startedAt: string;
};

/** Mirrors the camelCase shape returned by GET /api/patients/:id/notes. */
export type PatientNote = {
  id: string;
  appointmentId: string;
  appointmentDate: string | null;
  content: string;
  noteType: "general" | "coordination" | "clinical_summary" | "discharge";
  flagForFollowUp: boolean;
  createdAt: string;
};

/** Mirrors the shape returned by GET /api/wallet. */
export type PatientWallet = {
  id: string;
  patientId: string;
  balanceCents: number;
  updatedAt: string;
};

export type TimelineEntryType = "visit" | "note" | "status_update" | "lab";

export type TimelineEntry = {
  id: string;
  type: TimelineEntryType;
  date: string;
  title: string;
  detail: string;
  author: string | null;
  badge: string | null;
};
