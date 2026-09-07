"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthError = {
  message: string;
};

export async function signUp(formData: FormData): Promise<AuthError | null> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("name") as string | null;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName ?? undefined,
        role: "user",
      },
    },
  });

  if (error) {
    return { message: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/user?message=check_email");
}

export async function handleUserAuth(
  formData: FormData
): Promise<AuthError | null> {
  return signUp(formData);
}
