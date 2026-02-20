import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditForm } from "@/app/home/profile/ProfileEditForm";

const STAFF_ROLES = ["admin", "clinician"] as const;

const MailIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

export default async function ClinicianProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/clinician");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, avatar_url, created_at")
    .eq("id", user.id)
    .single();

  const role = profile?.role as string | undefined;
  if (!role || !STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number])) {
    redirect("/home");
  }

  const fullName = profile?.full_name ?? null;
  const avatarUrl = profile?.avatar_url ?? null;
  const roleLabel = role === "admin" ? "Administrator" : "Clinician";
  const createdAt = profile?.created_at ? new Date(profile.created_at) : null;
  const memberSince = createdAt
    ? createdAt.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  // Get some stats for the profile
  const [appointmentsResult, patientsResult] = await Promise.all([
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("clinician_id", user.id),
    supabase
      .from("sponsor_patient_plans")
      .select("patient_id", { count: "exact", head: true })
      .is("ended_at", null),
  ]);

  const totalAppointments = appointmentsResult.count ?? 0;
  const totalPatients = patientsResult.count ?? 0;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-[#E6E15A]/20 blur-3xl" />
        <div className="absolute right-[-10rem] bottom-[-10rem] h-[32rem] w-[48rem] rounded-full bg-[#9CCB4A]/15 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1F5F2E]/5 blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto min-h-screen w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/clinician-portal" className="flex items-center gap-3">
              <Image
                src="/island-echoes-health.svg"
                alt="Island Echoes Health"
                width={140}
                height={50}
                priority
                className="h-9 w-auto"
              />
            </Link>
            <span className="hidden h-6 w-px bg-slate-300 sm:block" />
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/clinician-portal"
                className="rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Dashboard
              </Link>
              <span className="text-slate-400">/</span>
              <span className="px-3 py-2 font-medium text-slate-900">Profile</span>
            </nav>
          </div>
          <Link
            href="/clinician-portal"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            ← Dashboard
          </Link>
        </header>

        <section className="mt-10">
          {/* Hero Section */}
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-[#1F5F2E]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#1F5F2E]">
              Clinician portal
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Profile & settings
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-600">
            Manage your professional profile and account information.
          </p>

          {/* Profile Edit Section */}
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white/90 p-8 shadow-lg backdrop-blur">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-[#1F5F2E]/10 p-2.5 text-[#1F5F2E]">
                <UsersIcon />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Personal information</h2>
                <p className="mt-0.5 text-sm text-slate-600">
                  Update your profile photo and display name
                </p>
              </div>
            </div>
            <ProfileEditForm initialAvatarUrl={avatarUrl} />
            
            {/* Account Info Grid */}
            <div className="mt-8 grid gap-4 border-t border-slate-200 pt-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-4">
                <div className="rounded-lg bg-white p-2 shadow-sm">
                  <MailIcon />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Email address
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-slate-900">
                    {user.email ?? "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-4">
                <div className="rounded-lg bg-white p-2 shadow-sm">
                  <ShieldIcon />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Role
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-slate-900">{roleLabel}</p>
                </div>
              </div>
              {memberSince && (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-4">
                  <div className="rounded-lg bg-white p-2 shadow-sm">
                    <CalendarIcon />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Member since
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-slate-900">{memberSince}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur transition hover:border-[#1F5F2E]/30 hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-[#1F5F2E]/20 to-[#9CCB4A]/20 p-3 text-[#1F5F2E]">
                  <CalendarIcon />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Total appointments</p>
                  <p className="mt-1 text-3xl font-bold text-slate-900">{totalAppointments}</p>
                </div>
              </div>
              <Link
                href="/clinician-portal/appointments"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#1F5F2E] hover:underline"
              >
                View appointments
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur transition hover:border-[#1F5F2E]/30 hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-[#1F5F2E]/20 to-[#9CCB4A]/20 p-3 text-[#1F5F2E]">
                  <UsersIcon />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Active patients</p>
                  <p className="mt-1 text-3xl font-bold text-slate-900">{totalPatients}</p>
                </div>
              </div>
              <Link
                href="/clinician-portal"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#1F5F2E] hover:underline"
              >
                View dashboard
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Sign out */}
          <div className="mt-10 rounded-2xl border border-red-200 bg-red-50/50 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Sign out</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Sign out of your account. You can sign back in anytime.
                </p>
              </div>
              <form action="/auth/signout" method="post">
                <input type="hidden" name="redirectTo" value="/" />
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 hover:shadow-md sm:w-auto"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
