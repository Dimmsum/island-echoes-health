import { createClientAdmin } from "./supabase.js";

export type NotificationType =
  | "consent_request"
  | "visit_update"
  | "no_show_alert"
  | "sponsorship_accepted"
  | "coordination_note"
  | "follow_up_due"
  | "follow_up_overdue"
  | "patient_status_update";

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string | null,
  referenceId: string | null
): Promise<void> {
  const admin = createClientAdmin();
  await admin.from("notifications").insert({
    user_id: userId,
    type,
    title,
    body,
    reference_id: referenceId,
  });
}

// Inserts only if a notification with the same (user, type, reference) hasn't already been sent
// today. Used by the follow-up reminder job so re-running it the same day doesn't re-notify.
// A check-then-insert (rather than a unique index) is used because the enum values this job
// fires can't be referenced by an index in the same migration that adds them — see 00037.
export async function createNotificationOnce(
  userId: string,
  type: NotificationType,
  title: string,
  body: string | null,
  referenceId: string
): Promise<boolean> {
  const admin = createClientAdmin();
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { data: existing } = await admin
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("type", type)
    .eq("reference_id", referenceId)
    .gte("created_at", startOfDay.toISOString())
    .limit(1)
    .maybeSingle();

  if (existing) return false;

  await createNotification(userId, type, title, body, referenceId);
  return true;
}

export async function notifyAdmins(
  type: NotificationType,
  title: string,
  body: string,
  referenceId: string | null
): Promise<void> {
  const admin = createClientAdmin();
  const { data: admins } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "admin");
  if (!admins?.length) return;
  for (const { id } of admins) {
    await createNotification(id, type, title, body, referenceId);
  }
}

export async function notifySponsorsOfPatient(
  patientId: string,
  type: NotificationType,
  title: string,
  body: string,
  referenceId: string | null = null
): Promise<void> {
  const admin = createClientAdmin();
  const { data: links } = await admin
    .from("sponsor_patient_plans")
    .select("sponsor_id")
    .eq("patient_id", patientId)
    .is("ended_at", null);
  if (!links?.length) return;
  for (const { sponsor_id } of links) {
    await createNotification(sponsor_id, type, title, body, referenceId);
  }
}
