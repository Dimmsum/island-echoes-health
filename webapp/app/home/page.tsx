import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchApiJson } from "@/lib/api";
import { UserHome } from "./UserHome";
import type { WalletTransaction } from "./WalletCard";
import type { StatusUpdate } from "@/app/clinician-portal/status-update-types";

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

  // Fetch wallet data — gracefully degrade if unavailable (e.g. sponsor/admin role)
  let wallet: { id: string; balanceCents: number; updatedAt: string } | null = null;
  let walletTransactions: WalletTransaction[] = [];
  // Status updates the care team shared with the patient (RLS returns all/patient_only).
  let statusUpdates: StatusUpdate[] = [];

  try {
    const [walletRes, txRes, statusRes] = await Promise.allSettled([
      fetchApiJson<{ wallet: { id: string; patientId: string; balanceCents: number; updatedAt: string } }>(
        session.access_token,
        "/api/wallet",
      ),
      fetchApiJson<{ transactions: WalletTransaction[] }>(
        session.access_token,
        "/api/wallet/transactions",
      ),
      fetchApiJson<{ statusUpdates: StatusUpdate[] }>(
        session.access_token,
        `/api/patients/${user.id}/status-updates`,
      ),
    ]);

    if (walletRes.status === "fulfilled") {
      const w = walletRes.value.wallet;
      wallet = { id: w.id, balanceCents: w.balanceCents, updatedAt: w.updatedAt };
    }
    if (txRes.status === "fulfilled") {
      walletTransactions = txRes.value.transactions ?? [];
    }
    if (statusRes.status === "fulfilled") {
      statusUpdates = statusRes.value.statusUpdates ?? [];
    }
  } catch {
    // Non-fatal — wallet/status sections degrade gracefully when data is absent
  }

  return (
    <UserHome
      fullName={fullName ?? homeData.profile?.full_name ?? null}
      linkedPatients={homeData.linkedPatients}
      mySponsors={homeData.mySponsors}
      pendingConsents={homeData.pendingConsents}
      upcomingAppointments={homeData.upcomingAppointments}
      notifications={homeData.notifications}
      wallet={wallet}
      walletTransactions={walletTransactions}
      statusUpdates={statusUpdates}
      patientId={user.id}
      viewerId={user.id}
    />
  );
}
