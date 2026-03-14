import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchApiJson } from "@/lib/api";
import { UserHome } from "./UserHome";

const STAFF_ROLES = ["admin", "clinician"] as const;

type HomePageProps = {
  searchParams: Promise<{ setup?: string; session_id?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", session.user.id)
    .single();
  const role = profile?.role as string | undefined;
  const fullName = profile?.full_name ?? null;

  if (role && STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number])) {
    redirect("/clinician-portal");
  }

  const homeData = await fetchApiJson<{
    profile: { role?: string; full_name: string | null } | null;
    linkedPatients: Parameters<typeof UserHome>[0]["linkedPatients"];
    mySponsors: Parameters<typeof UserHome>[0]["mySponsors"];
    pendingConsents: Parameters<typeof UserHome>[0]["pendingConsents"];
    upcomingAppointments: Parameters<typeof UserHome>[0]["upcomingAppointments"];
    notifications: Parameters<typeof UserHome>[0]["notifications"];
    carePlans: Parameters<typeof UserHome>[0]["carePlans"];
  }>(session.access_token, "/api/home");

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
