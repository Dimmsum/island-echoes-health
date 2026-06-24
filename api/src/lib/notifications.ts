import { createClientAdmin } from "./supabase.js";

type NotificationType =
  | "consent_request"
  | "visit_update"
  | "no_show_alert"
  | "sponsorship_accepted"
  | "coordination_note";

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
  type: "visit_update" | "no_show_alert",
  title: string,
  body: string
): Promise<void> {
  const admin = createClientAdmin();
  const { data: links } = await admin
    .from("sponsor_patient_plans")
    .select("sponsor_id")
    .eq("patient_id", patientId)
    .is("ended_at", null);
  if (!links?.length) return;
  for (const { sponsor_id } of links) {
    await createNotification(sponsor_id, type, title, body, null);
  }
}
