"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClientAdmin } from "@/lib/supabase/admin";
import {
  createSetupCheckoutSession,
  attachPaymentMethodFromSession,
  ensureCustomerForPaymentMethod,
  getOrCreatePriceForCarePlan,
  createSubscription,
  cancelSubscription,
} from "@/lib/stripe/server";

export type HomeActionResult = { error: string | null };

export type PurchasePlanResult =
  | { error: string | null; redirectUrl?: never }
  | { error: null; redirectUrl: string };

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
): Promise<PurchasePlanResult> {
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
    .select("full_name, stripe_customer_id")
    .eq("id", user.id)
    .single();
  const sponsorEmail = user.email ?? "";
  if (!sponsorEmail)
    return { error: "Your account must have an email to sponsor." };

  const { data: consentRequest, error: insertError } = await supabase
    .from("sponsorship_consent_requests")
    .insert({
      sponsor_id: user.id,
      patient_email: email,
      care_plan_id: carePlanId,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Insert consent request failed:", insertError);
    return { error: "Failed to submit. Please try again." };
  }

  const sessionResult = await createSetupCheckoutSession({
    consentRequestId: consentRequest.id,
    carePlanId,
    sponsorId: user.id,
    sponsorEmail,
    stripeCustomerId: profile?.stripe_customer_id ?? null,
  });

  if ("error" in sessionResult) {
    return { error: sessionResult.error };
  }

  revalidatePath("/home");
  return { error: null, redirectUrl: sessionResult.url };
}

export async function attachPaymentMethodAfterSetup(
  sessionId: string,
): Promise<HomeActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const attachResult = await attachPaymentMethodFromSession(sessionId);
  if ("error" in attachResult) {
    return { error: attachResult.error };
  }

  const admin = createClientAdmin();

  const { error: updateConsentError } = await admin
    .from("sponsorship_consent_requests")
    .update({
      stripe_payment_method_id: attachResult.paymentMethodId,
    })
    .eq("id", attachResult.consentRequestId);

  if (updateConsentError) {
    console.error("Update consent request with PM failed:", updateConsentError);
    return { error: "Failed to save payment method. Please try again." };
  }

  if (attachResult.stripeCustomerId) {
    await admin
      .from("profiles")
      .update({ stripe_customer_id: attachResult.stripeCustomerId })
      .eq("id", user.id);
  }

  const { data: consentRequest } = await admin
    .from("sponsorship_consent_requests")
    .select("id, patient_email, sponsor_id, care_plan_id")
    .eq("id", attachResult.consentRequestId)
    .single();

  if (consentRequest) {
    const { data: plan } = await admin
      .from("care_plans")
      .select("name")
      .eq("id", consentRequest.care_plan_id)
      .single();
    const { data: sponsorProfile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", consentRequest.sponsor_id)
      .single();
    const sponsorName = sponsorProfile?.full_name ?? "A sponsor";
    const { data: patientUserId } = await admin.rpc("get_user_id_by_email", {
      e: consentRequest.patient_email,
    });
    if (patientUserId) {
      await admin
        .from("sponsorship_consent_requests")
        .update({ patient_id: patientUserId })
        .eq("id", attachResult.consentRequestId);
      await createNotification(
        patientUserId,
        "consent_request",
        `${sponsorName} wants to sponsor your care`,
        `${sponsorName} has requested to sponsor the ${plan?.name ?? "plan"} for you. Accept to allow them to see your health information and appointment schedules.`,
        attachResult.consentRequestId,
      );
    }
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
    .select(
      "id, sponsor_id, patient_id, care_plan_id, status, stripe_payment_method_id",
    )
    .eq("id", consentRequestId)
    .single();

  if (fetchError || !request) return { error: "Request not found." };
  if (request.patient_id !== user.id)
    return { error: "You can only respond to your own consent requests." };
  if (request.status !== "pending")
    return { error: "This request was already responded to." };
  if (!request.stripe_payment_method_id) {
    return {
      error:
        "Sponsor has not completed payment setup. They must complete checkout first.",
    };
  }

  const { data: carePlan } = await supabase
    .from("care_plans")
    .select("price_cents, stripe_price_id")
    .eq("id", request.care_plan_id)
    .single();
  if (!carePlan) return { error: "Plan not found." };

  const { data: sponsorProfile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", request.sponsor_id)
    .single();

  const customerResult = await ensureCustomerForPaymentMethod(
    request.stripe_payment_method_id,
    sponsorProfile?.stripe_customer_id ?? null,
  );
  if ("error" in customerResult) {
    return { error: customerResult.error };
  }

  if (customerResult.created) {
    const adminForProfile = createClientAdmin();
    await adminForProfile
      .from("profiles")
      .update({ stripe_customer_id: customerResult.customerId })
      .eq("id", request.sponsor_id);
  }

  const priceResult = await getOrCreatePriceForCarePlan(
    request.care_plan_id,
    carePlan.price_cents,
    carePlan.stripe_price_id ?? null,
  );
  if ("error" in priceResult) {
    return { error: priceResult.error };
  }

  if (priceResult.created) {
    const adminForPlan = createClientAdmin();
    await adminForPlan
      .from("care_plans")
      .update({ stripe_price_id: priceResult.priceId })
      .eq("id", request.care_plan_id);
  }

  const subResult = await createSubscription({
    customerId: customerResult.customerId,
    paymentMethodId: request.stripe_payment_method_id,
    priceId: priceResult.priceId,
    metadata: {
      consent_request_id: consentRequestId,
      sponsor_id: request.sponsor_id,
      patient_id: request.patient_id,
      care_plan_id: request.care_plan_id,
    },
  });

  if ("error" in subResult) {
    return { error: subResult.error };
  }

  const admin = createClientAdmin();

  const { error: updateError } = await admin
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

  const { error: linkError } = await admin
    .from("sponsor_patient_plans")
    .insert({
      sponsor_id: request.sponsor_id,
      patient_id: request.patient_id,
      care_plan_id: request.care_plan_id,
      consent_request_id: consentRequestId,
      stripe_subscription_id: subResult.subscriptionId,
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

export async function endSponsorship(
  planId: string,
): Promise<HomeActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: plan, error: fetchError } = await supabase
    .from("sponsor_patient_plans")
    .select("id, sponsor_id, patient_id, stripe_subscription_id")
    .eq("id", planId)
    .is("ended_at", null)
    .single();

  if (fetchError || !plan) return { error: "Plan not found or already ended." };
  if (plan.sponsor_id !== user.id && plan.patient_id !== user.id) {
    return { error: "You can only end a sponsorship you are part of." };
  }

  if (plan.stripe_subscription_id) {
    const cancelResult = await cancelSubscription(plan.stripe_subscription_id);
    if ("error" in cancelResult) {
      console.error("cancelSubscription failed:", cancelResult.error);
      // Still set ended_at so app state is correct
    }
  }

  const admin = createClientAdmin();
  const { error: updateError } = await admin
    .from("sponsor_patient_plans")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", planId);

  if (updateError) {
    console.error("Update ended_at failed:", updateError);
    return { error: "Failed to end sponsorship." };
  }

  revalidatePath("/home");
  revalidatePath("/home/profile");
  revalidatePath(`/home/sponsored/${planId}`);
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

export async function updateProfile(
  fullName: string | null,
): Promise<HomeActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("Profile update failed:", error);
    return { error: "Failed to update profile." };
  }
  revalidatePath("/home/profile");
  revalidatePath("/home");
  revalidatePath("/clinician-portal/profile");
  revalidatePath("/clinician-portal");
  return { error: null };
}

export async function uploadAvatar(
  formData: FormData,
): Promise<HomeActionResult & { url?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const file = formData.get("avatar") as File | null;
  if (!file || !file.size) return { error: "Please select an image." };

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type))
    return { error: "Invalid file type. Use JPEG, PNG, WebP, or GIF." };
  if (file.size > 2 * 1024 * 1024)
    return { error: "Image must be under 2 MB." };

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true });

  if (uploadError) {
    console.error("Avatar upload failed:", uploadError);
    return { error: "Failed to upload image. Please try again." };
  }

  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
  const baseUrl = urlData.publicUrl;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      avatar_url: baseUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("Profile avatar_url update failed:", updateError);
    return { error: "Image uploaded but failed to save. Please try again." };
  }

  revalidatePath("/home/profile");
  revalidatePath("/home");
  revalidatePath("/clinician-portal/profile");
  revalidatePath("/clinician-portal");
  return { error: null, url: `${baseUrl}?t=${Date.now()}` };
}
