/** Mirrors the camelCase shape returned by GET /api/patients/:id/medications. */
export type Medication = {
  id: string;
  patientId: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  prescribedBy: string | null;
  startedAt: string;
  endedAt: string | null;
  notes: string | null;
  active: boolean;
  createdBy: string;
  createdAt: string;
};
