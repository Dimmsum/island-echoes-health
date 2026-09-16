export type RosterPatient = {
  patientId: string;
  patientName: string;
  patientAvatar: string | null;
  age: number | null;
  conditions: string[];
  latestBp: { systolic: number; diastolic: number; recordedAt: string } | null;
  lastAppointment: { scheduledAt: string; status: string } | null;
  nextAppointment: { scheduledAt: string; status: string } | null;
  openFollowUpsCount: number;
  overdueFollowUpsCount: number;
  topFollowUp: { dueDate: string; notes: string | null; overdue: boolean } | null;
  bucket: "overdue" | "open" | "onTrack";
  badge: "OVERDUE" | "IN CLINIC" | "TODAY" | null;
};
