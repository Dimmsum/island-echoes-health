"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClientAdmin } from "@/lib/supabase/admin";

export type AuthError = {
  message: string;
};

const STAFF_ROLES = ["admin", "clinician"] as const;

const ALLOWED_LICENSE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB

export async function submitClinicianRequest(
  formData: FormData
): Promise<AuthError | null> {
  const email = (formData.get("email") as string)?.trim();
  const fullName = (formData.get("name") as string)?.trim() || null;
  const licenseNumber = (formData.get("license_number") as string)?.trim();
  const specialty = (formData.get("specialty") as string)?.trim();
  const institutionOrClinicName = (
    formData.get("institution_or_clinic_name") as string
  )?.trim() || null;
  const file = formData.get("license_image") as File | null;

  if (!email) return { message: "Work email is required." };
  if (!licenseNumber) return { message: "License number is required." };
  if (!specialty) return { message: "Specialty is required." };
  if (!file || file.size === 0) {
    return { message: "Medical license image is required." };
  }
  if (!ALLOWED_LICENSE_TYPES.includes(file.type)) {
    return {
      message:
        "License must be an image (JPEG, PNG, WebP) or PDF.",
    };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { message: "License file must be 5 MB or smaller." };
  }

  const admin = createClientAdmin();

  const { data: existing } = await admin
    .from("clinician_signup_requests")
    .select("id")
    .eq("email", email)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    return {
      message:
        "A sign-up request with this email is already pending. Please wait for an administrator to review it.",
    };
  }

  const path = `${crypto.randomUUID()}/${file.name}`;
  const { error: uploadError } = await admin.storage
    .from("clinician-licenses")
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("License upload failed:", uploadError);
    return { message: "Failed to upload license image. Please try again." };
  }

  const { error: insertError } = await admin
    .from("clinician_signup_requests")
    .insert({
      email,
      full_name: fullName,
      license_number: licenseNumber,
      specialty,
      institution_or_clinic_name: institutionOrClinicName,
      license_image_path: path,
      status: "pending",
    });

  if (insertError) {
    if (insertError.code === "23505") {
      return {
        message:
          "A sign-up request with this email already exists. Please wait for an administrator to review it.",
      };
    }
    console.error("Insert clinician request failed:", insertError);
    return { message: "Failed to submit request. Please try again." };
  }

  revalidatePath("/", "layout");
  redirect("/clinician?message=request_submitted");
}

export async function signIn(formData: FormData): Promise<AuthError | null> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { message: error.message };
  }

  const userId = data.user?.id;
  if (!userId) {
    return { message: "Sign in failed." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    return {
      message: "Not authorized for the staff portal. Contact your organization administrator.",
    };
  }

  const role = profile.role as string;
  if (!STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number])) {
    await supabase.auth.signOut();
    return {
      message: "Not authorized for the staff portal. Contact your organization administrator.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/home");
}

export async function handleClinicianAuth(
  formData: FormData
): Promise<AuthError | null> {
  return signIn(formData);
}
