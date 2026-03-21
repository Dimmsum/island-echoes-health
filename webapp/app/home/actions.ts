"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type HomeActionResult = { error: string | null };

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:4001";

export type CreatePaymentResult =
  | {
      error: string | null;
      redirectUrl?: undefined;
      consentRequestId?: undefined;
    }
  | { error: null; redirectUrl: string; consentRequestId: string };

export type PurchasePlanResult =
  | { error: string }
  | { error: null; redirectUrl: string };

export type BillingPortalResult =
  | { error: string; url?: undefined }
  | { error: null; url: string };

/** Calls API to create a Stripe setup-checkout session for sponsorship. */
export async function createPaymentForPlan(
  patientEmail: string,
  carePlanId: string,
): Promise<CreatePaymentResult> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return { error: "Not signed in." };

  const email = patientEmail.trim().toLowerCase();
  if (!email) return { error: "Patient email is required." };
  if (!carePlanId) return { error: "Care plan is required." };

  const res = await fetch(`${API_BASE}/api/sponsorship/create-payment`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ patientEmail: email, carePlanId }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      res.status === 503
        ? "Payments are not configured. Please try again later."
        : (data?.error ?? "Failed to start payment setup.");
    return { error: message };
  }

  if (!data.checkoutUrl) return { error: "Invalid response from server." };

  return {
    error: null,
    redirectUrl: data.checkoutUrl,
    consentRequestId: data.consentRequestId,
  };
}

export async function purchasePlanForPatient(
  patientEmail: string,
  carePlanId: string,
): Promise<PurchasePlanResult> {
  const result = await createPaymentForPlan(patientEmail, carePlanId);
  if (result.error || !result.redirectUrl) {
    return { error: result.error ?? "Failed to start payment setup." };
  }
  return { error: null, redirectUrl: result.redirectUrl };
}

export async function attachPaymentMethodAfterSetup(
  sessionId: string,
): Promise<HomeActionResult> {
  if (!sessionId) return { error: "Missing setup session." };
  // Setup completion is handled by API webhook (checkout.session.completed).
  revalidatePath("/home");
  return { error: null };
}

export async function acceptConsentRequest(
  consentRequestId: string,
): Promise<HomeActionResult> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return { error: "Not signed in." };

  const res = await fetch(`${API_BASE}/api/sponsorship/accept`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ consentRequestId }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) {
    return { error: data?.error ?? "Failed to accept request." };
  }

  revalidatePath("/home");
  return { error: null };
}

export async function declineConsentRequest(
  consentRequestId: string,
  declineReason?: string,
): Promise<HomeActionResult> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return { error: "Not signed in." };

  const res = await fetch(`${API_BASE}/api/sponsorship/decline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ consentRequestId, declineReason }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) {
    return { error: data?.error ?? "Failed to decline request." };
  }

  revalidatePath("/home");
  return { error: null };
}

export async function endSponsorship(
  planId: string,
): Promise<HomeActionResult> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return { error: "Not signed in." };

  const res = await fetch(`${API_BASE}/api/sponsorship/end`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ planId }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) {
    return { error: data?.error ?? "Failed to end sponsorship." };
  }

  revalidatePath("/home");
  revalidatePath("/home/profile");
  revalidatePath(`/home/sponsored/${planId}`);
  return { error: null };
}

export async function getStripeCustomerPortalUrl(): Promise<BillingPortalResult> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return { error: "Not signed in." };

  const res = await fetch(`${API_BASE}/api/stripe/portal`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error || !data?.url) {
    return {
      error: data?.error ?? "Unable to open billing portal. Please try again.",
    };
  }

  return { error: null, url: data.url };
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
