"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthError = {
  message: string;
};

const STAFF_ROLES = ["front_desk", "clinician"] as const;

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
