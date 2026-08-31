import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchApiJson } from "@/lib/api";
import { UserNavbar } from "../home/UserNavbar";
import { fetchSponsoredPatientDetail, fetchSelfPatientDetail } from "./actions";
import { PatientsPageClient } from "./PatientsPageClient";

const STAFF_ROLES = ["admin", "clinician"] as const;

type LinkedPatient = {
  id: string;
  started_at: string;
  care_plan: { id: string; name: string; slug: string; price_cents: number } | null;
  patient: { id: string; full_name: string | null; age: number | null; avatar_url: string | null } | null;
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

type Props = {
  searchParams: Promise<{ patient?: string }>;
};

export default async function PatientsPage({ searchParams }: Props) {
  const { patient: requestedLinkId } = await searchParams;

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
    .select("role, full_name, avatar_url")
    .eq("id", user.id)
    .single();
  const role = profile?.role as string | undefined;
  const fullName = profile?.full_name ?? null;
  const viewerAvatarUrl = profile?.avatar_url ?? null;

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
        <UserNavbar fullName={fullName} notifications={[]} activePath="/patients" />
        <main className="mx-auto max-w-[1200px] px-7 py-6">
          <p className="text-[14px] text-[#94a298]">
            Unable to load your patients. Please refresh or try again later.
          </p>
        </main>
      </div>
    );
  }

  // "self" is a sentinel selection meaning "my own info" (the You pill), distinct
  // from any real sponsor_patient_plans link id.
  const initialLinkId =
    requestedLinkId && linkedPatients.some((lp) => lp.id === requestedLinkId)
      ? requestedLinkId
      : (linkedPatients[0]?.id ?? "self");
  const initialDetail =
    initialLinkId === "self" ? await fetchSelfPatientDetail() : await fetchSponsoredPatientDetail(initialLinkId);

  return (
    <PatientsPageClient
      fullName={fullName}
      viewerAvatarUrl={viewerAvatarUrl}
      notifications={notifications}
      linkedPatients={linkedPatients}
      viewerId={session.user.id}
      initialLinkId={initialLinkId}
      initialDetail={initialDetail}
    />
  );
}
