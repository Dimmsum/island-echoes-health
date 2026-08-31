import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchApiJson } from "@/lib/api";
import { UserNavbar } from "@/app/home/UserNavbar";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
  reference_id: string | null;
};

type Appointment = {
  id: string;
  patient_id: string;
  clinician_id: string;
  scheduled_at: string;
  status: string;
  appointment_type: string | null;
  patient_name: string | null;
  patient_avatar?: string | null;
  clinician_name: string | null;
  is_self: boolean;
};

const TYPE_LABEL: Record<string, string> = {
  wellness_check: "Wellness Check",
  follow_up: "Follow-up",
  chronic_care: "Chronic Care",
  coordination: "Care Coordination",
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Upcoming",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
  missed: "Missed",
};

const STATUS_BADGE_STYLE: Record<string, string> = {
  scheduled: "bg-[#E4F1E9] text-[#1F8A5B]",
  completed: "bg-[#E9EEF8] text-[#3b5998]",
  cancelled: "bg-[#FBE3E3] text-[#B23B3B]",
  no_show: "bg-[#FBF1CF] text-[#9a7a06]",
  missed: "bg-[#FBF1CF] text-[#9a7a06]",
};

// The API only reports the status a clinician last set — a "scheduled" appointment
// whose time has already passed needs to be reclassified as past/missed here since
// nothing flips it server-side.
function getDisplayStatus(apt: Appointment): string {
  if (apt.status === "scheduled" && new Date(apt.scheduled_at).getTime() < Date.now()) {
    return "missed";
  }
  return apt.status;
}

const monoStyle = { fontFamily: "var(--font-ibm-mono, 'IBM Plex Mono', monospace)" };
const sansStyle = { fontFamily: "var(--font-hanken, 'Hanken Grotesk', sans-serif)" };

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

function AppointmentCard({ apt, past = false }: { apt: Appointment; past?: boolean }) {
  const monoStyle = { fontFamily: "var(--font-ibm-mono, 'IBM Plex Mono', monospace)" };
  const date = new Date(apt.scheduled_at);
  const dateStr = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase();
  const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const typeLabel = apt.appointment_type ? (TYPE_LABEL[apt.appointment_type] ?? apt.appointment_type) : "Visit";
  const displayStatus = getDisplayStatus(apt);
  const statusLabel = STATUS_LABEL[displayStatus] ?? displayStatus;
  const badgeStyle = STATUS_BADGE_STYLE[displayStatus] ?? "bg-[#E9EEF8] text-[#3b5998]";

  return (
    <div
      className={`relative flex items-center gap-5 rounded-2xl border bg-white p-[22px] ${
        past ? "border-[#E9EEE9]" : apt.is_self ? "border-[#C9E6D5]" : "border-[#CFE0FA]"
      }`}
    >
      {/* Dot indicator */}
      <div className="flex shrink-0 flex-col items-center gap-1.5">
        {past ? (
          displayStatus === "cancelled" ? (
            <div
              className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-[10px] font-extrabold text-[#B23B3B]"
              style={{ background: "#FBE3E3", boxShadow: "0 0 0 3px #F6D3D3" }}
            >
              ✕
            </div>
          ) : displayStatus === "no_show" || displayStatus === "missed" ? (
            <div
              className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-[10px] font-extrabold text-[#9a7a06]"
              style={{ background: "#FBF1CF", boxShadow: "0 0 0 3px #F5E6A8" }}
            >
              !
            </div>
          ) : (
            <div
              className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-[10px] font-extrabold text-[#1F8A5B]"
              style={{ background: "#E4F1E9", boxShadow: "0 0 0 3px #DCEFE3" }}
            >
              ✓
            </div>
          )
        ) : (
          <div
            className={`h-[26px] w-[26px] rounded-full ${apt.is_self ? "bg-[#1F8A5B]" : "bg-[#3b5998]"}`}
            style={{ boxShadow: apt.is_self ? "0 0 0 3px #C9E6D5" : "0 0 0 3px #CFE0FA" }}
          />
        )}
      </div>

      {/* Date + time */}
      <div className="w-40 shrink-0">
        <p style={monoStyle} className={`text-[11px] font-semibold uppercase tracking-[.08em] ${past ? "text-[#aab5ad]" : apt.is_self ? "text-[#1F8A5B]" : "text-[#3b5998]"}`}>
          {dateStr}
        </p>
        <p style={monoStyle} className={`mt-0.5 text-[13px] font-bold ${past ? "text-[#c0c8c3]" : apt.is_self ? "text-[#1F8A5B]" : "text-[#3b5998]"}`}>
          {timeStr}
        </p>
      </div>

      {/* Details */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className={`text-[15px] font-bold ${past ? "text-[#7a8a80]" : "text-[#16241D]"}`}>{typeLabel}</p>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[.04em] ${
              apt.is_self ? "bg-[#E4F1E9] text-[#1F8A5B]" : "bg-[#E9EEF8] text-[#3b5998]"
            }`}
          >
            {apt.is_self ? "You" : apt.patient_name ?? "Connected"}
          </span>
        </div>
        {apt.clinician_name && (
          <p className="mt-0.5 text-[13px] text-[#5a6a60]">with {apt.clinician_name}</p>
        )}
      </div>

      {/* Status badge */}
      <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${badgeStyle}`}>
        {statusLabel}
      </span>
    </div>
  );
}
