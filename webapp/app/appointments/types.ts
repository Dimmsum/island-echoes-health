export type Appointment = {
  id: string;
  patient_id: string;
  clinician_id: string;
  scheduled_at: string;
  status: string;
  appointment_type: string | null;
  patient_name: string | null;
  patient_avatar?: string | null;
  clinician_name: string | null;
  is_self: boolean;
};

export const TYPE_LABEL: Record<string, string> = {
  wellness_check: "Wellness Check",
  follow_up: "Follow-up",
  chronic_care: "Chronic Care",
  coordination: "Care Coordination",
};

export const STATUS_LABEL: Record<string, string> = {
  scheduled: "Upcoming",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
  missed: "Missed",
};

export const STATUS_BADGE_STYLE: Record<string, string> = {
  scheduled: "bg-[#E4F1E9] text-[#1F8A5B]",
  completed: "bg-[#E9EEF8] text-[#3b5998]",
  cancelled: "bg-[#FBE3E3] text-[#B23B3B]",
  no_show: "bg-[#FBF1CF] text-[#9a7a06]",
  missed: "bg-[#FBF1CF] text-[#9a7a06]",
};

// The API only reports the status a clinician last set — a "scheduled" appointment
// whose time has already passed needs to be reclassified as past/missed here since
// nothing flips it server-side.
export function getDisplayStatus(apt: Appointment): string {
  if (apt.status === "scheduled" && new Date(apt.scheduled_at).getTime() < Date.now()) {
    return "missed";
  }
  return apt.status;
}
