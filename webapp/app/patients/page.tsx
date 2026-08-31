import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchApiJson } from "@/lib/api";
import { UserNavbar } from "../home/UserNavbar";

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

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const AVATAR_COLORS = [
  { bg: "#E7E1F2", text: "#5b4a86" },
  { bg: "#D6E8F2", text: "#2b5e7d" },
  { bg: "#DCEFE3", text: "#13643F" },
  { bg: "#F2E1D6", text: "#7d4a2b" },
];

export default async function PatientsPage() {
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
      profile: { full_name: string | null } | null;
      linkedPatients: LinkedPatient[];
      notifications: Notification[];
    }>(session.access_token, "/api/home");
    linkedPatients = homeData.linkedPatients ?? [];
    notifications = homeData.notifications ?? [];
  } catch {
    return (
      <div className="min-h-screen bg-[#F4F7F3]">
        <UserNavbar fullName={fullName} notifications={[]} activePath="/patients" />
        <main className="mx-auto max-w-[1440px] px-7 py-6">
          <p className="text-[14px] text-[#94a298]">
            Unable to load your patients. Please refresh or try again later.
          </p>
        </main>
      </div>
    );
  }

  const monoStyle = { fontFamily: "var(--font-ibm-mono, 'IBM Plex Mono', monospace)" };
  const sansStyle = { fontFamily: "var(--font-hanken, 'Hanken Grotesk', sans-serif)" };

  return (
    <div className="min-h-screen bg-[#F4F7F3]" style={sansStyle}>
      <UserNavbar fullName={fullName} notifications={notifications} activePath="/patients" />

      <div className="mx-auto max-w-[1440px] px-7 py-6">
        <div className="mb-6">
          <div style={monoStyle} className="text-[11px] uppercase tracking-[.12em] text-[#8a988f]">
            Care circle
          </div>
          <h1 className="mt-1 text-[24px] font-bold text-[#16241D]">Patients</h1>
          <p className="mt-1 text-[13.5px] text-[#6a7a70]">
            Everyone you sponsor, in one place.
          </p>
        </div>

        <div className="rounded-2xl border border-[#E9EEE9] bg-white p-[22px]">
          {linkedPatients.length === 0 ? (
            <div className="py-12 text-center text-[14px] text-[#94a298]">
              No patients yet.
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {linkedPatients.map((lp, i) => {
                const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
                const name = lp.patient?.full_name ?? "Patient";
                const startedDate = new Date(lp.started_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                return (
                  <li key={lp.id}>
                    <Link
                      href={`/home/sponsored/${lp.id}`}
                      className="flex items-center gap-3 rounded-xl border border-[#EEF2EE] px-4 py-3.5 transition hover:border-[#1F8A5B]/30 hover:bg-[#F6FAF7]"
                    >
                      {lp.patient?.avatar_url ? (
                        <img
                          src={lp.patient.avatar_url}
                          alt=""
                          className="h-11 w-11 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
                          style={{ background: color.bg, color: color.text }}
                        >
                          {getInitials(lp.patient?.full_name ?? null)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-semibold text-[#16241D]">
                          {name}
                          {lp.patient?.age != null && (
                            <span className="ml-1.5 font-normal text-[#94a298]">
                              · {lp.patient.age}y
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 truncate text-[12px] text-[#94a298]">
                          {lp.care_plan?.name ?? "Care plan"} · Since {startedDate}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
