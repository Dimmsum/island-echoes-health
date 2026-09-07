"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthError = {
  message: string;
};

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
  let role: string | null = null;
  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    role = profile?.role ?? null;
  }

  revalidatePath("/", "layout");

  if (role === "admin") {
    redirect("/admin");
  }
  if (role === "clinician") {
    redirect("/clinician-portal");
  }
  redirect("/home");
}
