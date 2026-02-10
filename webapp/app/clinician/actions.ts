"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthError = {
  message: string;
};

const STAFF_ROLES = ["admin", "clinician"] as const;

export async function signUp(formData: FormData): Promise<AuthError | null> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("name") as string | null;
  const role = (formData.get("role") as "admin" | "clinician") ?? "clinician";

  if (!STAFF_ROLES.includes(role)) {
    return { message: "Invalid role." };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName ?? undefined,
        role,
      },
    },
  });

  if (error) {
    return { message: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/clinician?message=check_email");
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
  const mode = formData.get("mode") as string;

  if (mode === "signup") {
    return signUp(formData);
  }
  return signIn(formData);
}
