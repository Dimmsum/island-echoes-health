"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClientAdmin } from "@/lib/supabase/admin";

export type HomeActionResult = { error: string | null };

type NotificationType =
  | "consent_request"
  | "visit_update"
  | "no_show_alert"
  | "sponsorship_accepted";

async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string | null,
  referenceId: string | null,
) {
  const admin = createClientAdmin();
  await admin.from("notifications").insert({
    user_id: userId,
    type,
    title,
    body,
    reference_id: referenceId,
  });
}

export async function purchasePlanForPatient(
  patientEmail: string,
  carePlanId: string,
): Promise<HomeActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const email = patientEmail.trim().toLowerCase();
  if (!email) return { error: "Patient email is required." };

  const { data: plan } = await supabase
    .from("care_plans")
    .select("id, name")
    .eq("id", carePlanId)
    .single();
  if (!plan) return { error: "Invalid plan." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
  const sponsorName = profile?.full_name ?? "A sponsor";

  const { data: consentRequest, error: insertError } = await supabase
    .from("sponsorship_consent_requests")
    .insert({
      sponsor_id: user.id,
      patient_email: email,
      care_plan_id: carePlanId,
      status: "pending",
      payment_simulated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Insert consent request failed:", insertError);
    return { error: "Failed to submit. Please try again." };
  }

  const admin = createClientAdmin();
  const { data: patientUserId } = await admin.rpc("get_user_id_by_email", {
    e: email,
  });
  if (patientUserId) {
    await admin
      .from("sponsorship_consent_requests")
      .update({ patient_id: patientUserId })
      .eq("id", consentRequest.id);
    await createNotification(
      patientUserId,
      "consent_request",
      `${sponsorName} wants to sponsor your care`,
      `${sponsorName} has purchased the ${plan.name} plan for you. Accept to allow them to see your health information and appointment schedules.`,
      consentRequest.id,
    );
  }

  revalidatePath("/home");
  return { error: null };
}

export async function acceptConsentRequest(
  consentRequestId: string,
): Promise<HomeActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: request, error: fetchError } = await supabase
    .from("sponsorship_consent_requests")
    .select("id, sponsor_id, patient_id, care_plan_id, status")
    .eq("id", consentRequestId)
    .single();

  if (fetchError || !request) return { error: "Request not found." };
  if (request.patient_id !== user.id)
    return { error: "You can only respond to your own consent requests." };
  if (request.status !== "pending")
    return { error: "This request was already responded to." };

  const { error: updateError } = await supabase
    .from("sponsorship_consent_requests")
    .update({
      status: "accepted",
      responded_at: new Date().toISOString(),
    })
    .eq("id", consentRequestId);

  if (updateError) {
    console.error("Update consent request failed:", updateError);
    return { error: "Failed to accept." };
  }

  const { error: linkError } = await supabase
    .from("sponsor_patient_plans")
    .insert({
      sponsor_id: request.sponsor_id,
      patient_id: request.patient_id,
      care_plan_id: request.care_plan_id,
      consent_request_id: consentRequestId,
    });

  if (linkError) {
    console.error("Insert sponsor_patient_plans failed:", linkError);
    return { error: "Failed to link. Please try again." };
  }

  const { data: patientProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
  const patientName = patientProfile?.full_name ?? "Your patient";

  await createNotification(
    request.sponsor_id,
    "sponsorship_accepted",
    "Sponsorship accepted",
    `${patientName} accepted your care plan sponsorship. You can now view their metrics and appointments.`,
    consentRequestId,
  );

  revalidatePath("/home");
  return { error: null };
}

export async function declineConsentRequest(
  consentRequestId: string,
  declineReason?: string,
): Promise<HomeActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: request } = await supabase
    .from("sponsorship_consent_requests")
    .select("id, patient_id, status")
    .eq("id", consentRequestId)
    .single();

  if (!request) return { error: "Request not found." };
  if (request.patient_id !== user.id)
    return { error: "You can only respond to your own consent requests." };
  if (request.status !== "pending")
    return { error: "This request was already responded to." };

  const { error } = await supabase
    .from("sponsorship_consent_requests")
    .update({
      status: "declined",
      responded_at: new Date().toISOString(),
      decline_reason: declineReason?.trim() || null,
    })
    .eq("id", consentRequestId);

  if (error) {
    console.error("Decline consent request failed:", error);
    return { error: "Failed to decline." };
  }

  revalidatePath("/home");
  return { error: null };
}

export async function markNotificationRead(
  notificationId: string,
): Promise<HomeActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Mark notification read failed:", error);
    return { error: "Failed to mark as read." };
  }

  revalidatePath("/home");
  return { error: null };
}

export async function clearAllNotifications(): Promise<HomeActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    console.error("Clear notifications failed:", error);
    return { error: "Failed to clear notifications." };
  }

  revalidatePath("/home", "layout");
  return { error: null };
}
