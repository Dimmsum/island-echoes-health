import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClinicianHome } from "./ClinicianHome";
import { UserHome } from "./UserHome";

const STAFF_ROLES = ["admin", "clinician"] as const;

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  const role = profile?.role as string | undefined;
  const fullName = profile?.full_name ?? null;

  if (role && STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number])) {
    return (
      <ClinicianHome
        fullName={fullName}
        role={role as "admin" | "clinician"}
      />
    );
  }

  return <UserHome fullName={fullName} />;
}
