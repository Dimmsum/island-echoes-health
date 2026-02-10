import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");

  const formData = await req.formData();
  const redirectTo = (formData.get("redirectTo") as string) ?? req.nextUrl.searchParams.get("redirectTo") ?? "/";
  return NextResponse.redirect(new URL(redirectTo, req.url), {
    status: 302,
  });
}
