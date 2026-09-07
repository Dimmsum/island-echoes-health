export type LabPanelType = "lipid_panel" | "metabolic_panel" | "other";

/** Mirrors the camelCase shape returned by GET /api/patients/:id/labs. */
export type LabResult = {
  id: string;
  patientId: string;
  panelType: LabPanelType;
  testName: string;
  value: number;
  unit: string | null;
  referenceLow: number | null;
  referenceHigh: number | null;
  drawnAt: string;
  createdBy: string;
  createdAt: string;
};
