import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchApiJson } from "@/lib/api";
import { UserNavbar } from "@/app/home/UserNavbar";
import { AppointmentCard } from "./AppointmentCard";
import { Appointment, getDisplayStatus } from "./types";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
  reference_id: string | null;
};

const sansStyle = { fontFamily: "var(--font-hanken, 'Hanken Grotesk', sans-serif)" };
const monoStyle = { fontFamily: "var(--font-ibm-mono, 'IBM Plex Mono', monospace)" };

export default async function AppointmentsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", session.user.id)
    .single();

  const fullName = profile?.full_name ?? null;

  const [{ appointments }, profileData] = await Promise.all([
    fetchApiJson<{ appointments: Appointment[] }>(session.access_token, "/api/home/appointments"),
    fetchApiJson<{ notifications: Notification[] }>(session.access_token, "/api/home/profile").catch(
      () => ({ notifications: [] as Notification[] })
    ),
  ]);

  const notifications = profileData.notifications ?? [];
  const upcoming = appointments.filter((a) => getDisplayStatus(a) === "scheduled");
  const past = appointments.filter((a) => getDisplayStatus(a) !== "scheduled");

  return (
    <div className="min-h-screen bg-[#F4F7F3]" style={sansStyle}>
      <UserNavbar fullName={fullName} notifications={notifications} activePath="/appointments" />

      <main className="mx-auto max-w-[1200px] px-7 py-8">
        {/* Page header */}
        <div className="flex items-end justify-between">
          <div>
            <p style={monoStyle} className="mb-1 text-[11px] uppercase tracking-[.12em] text-[#8a988f]">
              Your visits
            </p>
            <h1 className="text-[28px] font-bold tracking-[-0.02em] text-[#16241D]">Appointments</h1>
          </div>
          <Link
            href="/appointments/new"
            className="rounded-[10px] bg-[#1F8A5B] px-5 py-2 text-[13.5px] font-semibold text-white hover:bg-[#17764e]"
          >
            + Book
          </Link>
        </div>

        {/* Upcoming */}
        <section className="mt-8">
          <p style={monoStyle} className="mb-4 text-[11px] uppercase tracking-[.12em] text-[#8a988f]">
            Upcoming
          </p>

          {upcoming.length === 0 ? (
            <div className="rounded-2xl border border-[#E9EEE9] bg-white p-[22px] text-center">
              <p className="text-[14px] text-[#94a298]">No upcoming appointments.</p>
              <Link
                href="/appointments/new"
                className="mt-3 inline-block rounded-[10px] bg-[#1F8A5B] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#17764e]"
              >
                Book one now
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((apt) => (
                <AppointmentCard key={apt.id} apt={apt} />
              ))}
            </div>
          )}
        </section>

        {/* Past */}
        {past.length > 0 && (
          <section className="mt-10">
            <p style={monoStyle} className="mb-4 text-[11px] uppercase tracking-[.12em] text-[#8a988f]">
              Past
            </p>
            <div className="space-y-3">
              {past.map((apt) => (
                <AppointmentCard key={apt.id} apt={apt} past />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
