import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchApiJson } from "@/lib/api";
import { PatientsPageClient } from "./PatientsPageClient";
import type { RosterPatient } from "./roster-types";

const STAFF_ROLES = ["admin", "clinician"] as const;

export default async function ClinicianPortalPatientsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/clinician");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, avatar_url")
    .eq("id", user.id)
    .single();

  const role = profile?.role as string | undefined;
  const fullName = profile?.full_name ?? null;
  const avatarUrl = profile?.avatar_url ?? null;

  if (!role || !STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number])) {
    redirect("/home");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  let patients: RosterPatient[] = [];
  if (session?.access_token) {
    try {
      const result = await fetchApiJson<{ patients: RosterPatient[] }>(
        session.access_token,
        "/api/clinician-portal/patients",
      );
      patients = result.patients;
    } catch {
      patients = [];
    }
  }

  return (
    <PatientsPageClient
      fullName={fullName}
      avatarUrl={avatarUrl}
      role={role as "admin" | "clinician"}
      patients={patients}
    />
  );
}
