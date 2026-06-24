export const STATUS_UPDATE_VISIBILITIES = [
  "all",
  "sponsor_only",
  "patient_only",
] as const;

export type StatusUpdateVisibility = (typeof STATUS_UPDATE_VISIBILITIES)[number];

export type StatusUpdate = {
  id: string;
  patientId: string;
  createdBy: string;
  statusText: string;
  visibility: StatusUpdateVisibility;
  createdAt: string;
};
