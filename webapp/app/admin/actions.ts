"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClientAdmin } from "@/lib/supabase/admin";

const TEMP_PASSWORD_LENGTH = 24;

function randomPassword(): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let s = "";
  const bytes = new Uint8Array(TEMP_PASSWORD_LENGTH);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  }
  for (let i = 0; i < TEMP_PASSWORD_LENGTH; i++) {
    s += chars[bytes[i]! % chars.length];
  }
  return s;
}

export type AdminActionResult = { error: string | null };

export async function approveClinicianRequest(
  requestId: string
): Promise<AdminActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not signed in." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Not authorized." };
  }

  const admin = createClientAdmin();

  const { data: request, error: fetchError } = await admin
    .from("clinician_signup_requests")
    .select("id, email, full_name, status")
    .eq("id", requestId)
    .single();

  if (fetchError || !request) {
    return { error: "Request not found." };
  }
  if (request.status !== "pending") {
    return { error: "Request was already reviewed." };
  }

  const tempPassword = randomPassword();

  const { data: newUser, error: createError } = await admin.auth.admin.createUser(
    {
      email: request.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: request.full_name ?? undefined,
        role: "clinician",
      },
    }
  );

  if (createError) {
    if (createError.message.includes("already been registered")) {
      await admin
        .from("clinician_signup_requests")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", requestId);
      revalidatePath("/admin");
      return { error: null };
    }
    console.error("Create user failed:", createError);
    return { error: createError.message };
  }

  const { error: linkError } = await admin.auth.resetPasswordForEmail(
    request.email,
    { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/clinician` }
  );

  if (linkError) {
    console.error("Reset password email failed:", linkError);
  }

  const { error: updateError } = await admin
    .from("clinician_signup_requests")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", requestId);

  if (updateError) {
    console.error("Update request status failed:", updateError);
    return { error: "Failed to update request status." };
  }

  revalidatePath("/admin");
  return { error: null };
}

export async function rejectClinicianRequest(
  requestId: string
): Promise<AdminActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not signed in." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Not authorized." };
  }

  const admin = createClientAdmin();

  const { data: request, error: fetchError } = await admin
    .from("clinician_signup_requests")
    .select("id, status")
    .eq("id", requestId)
    .single();

  if (fetchError || !request) {
    return { error: "Request not found." };
  }
  if (request.status !== "pending") {
    return { error: "Request was already reviewed." };
  }

  const { error: updateError } = await admin
    .from("clinician_signup_requests")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", requestId);

  if (updateError) {
    console.error("Update request status failed:", updateError);
    return { error: "Failed to update request status." };
  }

  revalidatePath("/admin");
  return { error: null };
}
