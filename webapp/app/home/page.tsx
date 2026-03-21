import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchApiJson } from "@/lib/api";
import { UserHome } from "./UserHome";

const STAFF_ROLES = ["admin", "clinician"] as const;

export default async function HomePage() {
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

  let homeData;
  try {
    homeData = await fetchApiJson<{
    profile: { role?: string; full_name: string | null } | null;
    linkedPatients: Parameters<typeof UserHome>[0]["linkedPatients"];
    mySponsors: Parameters<typeof UserHome>[0]["mySponsors"];
    pendingConsents: Parameters<typeof UserHome>[0]["pendingConsents"];
    upcomingAppointments: Parameters<
      typeof UserHome
    >[0]["upcomingAppointments"];
    notifications: Parameters<typeof UserHome>[0]["notifications"];
    carePlans: Parameters<typeof UserHome>[0]["carePlans"];
  }>(session.access_token, "/api/home");
  } catch {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">
          Unable to load your dashboard. Please refresh or try again later.
        </p>
      </main>
    );
  }

  return (
    <UserHome
      fullName={fullName ?? homeData.profile?.full_name ?? null}
      linkedPatients={homeData.linkedPatients}
      mySponsors={homeData.mySponsors}
      pendingConsents={homeData.pendingConsents}
      upcomingAppointments={homeData.upcomingAppointments}
      notifications={homeData.notifications}
      carePlans={homeData.carePlans}
    />
  );
}
