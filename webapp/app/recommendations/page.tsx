import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchApiJson } from "@/lib/api";
import { UserNavbar } from "../home/UserNavbar";
import { RecommendationsPageClient } from "./RecommendationsPageClient";
import { fetchSpecialtySuggestions } from "./actions";

// Provider data may never be cached or stored (Google Places licence), so this
// page must render fresh on every request.
export const dynamic = "force-dynamic";

const STAFF_ROLES = ["admin", "clinician"] as const;

type LinkedPatient = {
  id: string;
  patient: { id: string; full_name: string | null } | null;
};

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
  reference_id: string | null;
};

export default async function RecommendationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();
  const role = profile?.role as string | undefined;
  const fullName = profile?.full_name ?? null;

  if (role && STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number])) {
    redirect("/clinician-portal");
  }

  let linkedPatients: LinkedPatient[] = [];
  let notifications: Notification[] = [];
  try {
    const homeData = await fetchApiJson<{
      linkedPatients: LinkedPatient[];
      notifications: Notification[];
    }>(session.access_token, "/api/home");
    linkedPatients = homeData.linkedPatients ?? [];
    notifications = homeData.notifications ?? [];
  } catch {
    return (
      <div className="min-h-screen bg-[#F4F7F3]">
        <UserNavbar fullName={fullName} notifications={[]} activePath="/recommendations" />
        <main className="mx-auto max-w-[1200px] px-7 py-6">
          <p className="text-[14px] text-[#94a298]">
            Unable to load recommendations. Please refresh or try again later.
          </p>
        </main>
      </div>
    );
  }

  const { suggestions } = await fetchSpecialtySuggestions();

  return (
    <RecommendationsPageClient
      fullName={fullName}
      notifications={notifications}
      linkedPatients={linkedPatients}
      viewerId={user.id}
      initialSuggestions={suggestions}
    />
  );
}
