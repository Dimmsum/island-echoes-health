export type CareContinuityPatient = {
  patientId: string;
  patientName: string;
  patientAvatar: string | null;
  lastAppointmentDate: string | null;
  daysSinceLastAppointment: number | null;
  openFollowUpsCount: number;
  overdueFollowUpsCount: number;
};

/** A patient is flagged when unseen 30+ days (or never seen) or has an overdue follow-up. */
export function needsAttention(p: CareContinuityPatient): boolean {
  return (
    (p.daysSinceLastAppointment !== null && p.daysSinceLastAppointment >= 30) ||
    p.daysSinceLastAppointment === null ||
    p.overdueFollowUpsCount > 0
  );
}
