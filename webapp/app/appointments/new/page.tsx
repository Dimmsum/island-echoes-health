import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchApiJson } from "@/lib/api";
import { UserNavbar } from "@/app/home/UserNavbar";
import { BookAppointmentForm } from "./BookAppointmentForm";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
  reference_id: string | null;
};

type Clinician = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

const monoStyle = { fontFamily: "var(--font-ibm-mono, 'IBM Plex Mono', monospace)" };
const sansStyle = { fontFamily: "var(--font-hanken, 'Hanken Grotesk', sans-serif)" };

export default async function NewAppointmentPage() {
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

  const [{ clinicians }, profileData] = await Promise.all([
    fetchApiJson<{ clinicians: Clinician[] }>(session.access_token, "/api/clinicians"),
    fetchApiJson<{ notifications: Notification[] }>(session.access_token, "/api/home/profile").catch(
      () => ({ notifications: [] as Notification[] })
    ),
  ]);

  const notifications = profileData.notifications ?? [];

  return (
    <div className="min-h-screen bg-[#F4F7F3]" style={sansStyle}>
      <UserNavbar fullName={fullName} notifications={notifications} activePath="/appointments" />

      <main className="mx-auto max-w-[860px] px-7 py-8">
        <div>
          <p style={monoStyle} className="mb-1 text-[11px] uppercase tracking-[.12em] text-[#8a988f]">
            Schedule a visit
          </p>
          <h1 className="text-[28px] font-bold tracking-[-0.02em] text-[#16241D]">Book an Appointment</h1>
          <p className="mt-1 text-[14px] text-[#5a6a60]">
            Select your clinician, visit type, and preferred date.
          </p>
        </div>

        <BookAppointmentForm clinicians={clinicians} />
      </main>
    </div>
  );
}
