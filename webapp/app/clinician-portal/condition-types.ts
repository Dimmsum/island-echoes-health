export type ConditionType = "condition" | "allergy";

/** Mirrors the camelCase shape returned by GET /api/patients/:id/conditions. */
export type PatientCondition = {
  id: string;
  patientId: string;
  label: string;
  type: ConditionType;
  severity: string | null;
  createdBy: string;
  createdAt: string;
};
