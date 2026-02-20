import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserNavbar } from "../UserNavbar";
import { ProfileEditForm } from "./ProfileEditForm";

const STAFF_ROLES = ["admin", "clinician"] as const;

// Dummy monthly expense data for UI preview
const DUMMY_MONTHLY_EXPENSES = [
  { plan: "Core Wellness", amount: 75 },
  { plan: "Chronic Care", amount: 120 },
];
const DUMMY_TOTAL = DUMMY_MONTHLY_EXPENSES.reduce((s, x) => s + x.amount, 0);

const UsersIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const HeartIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const CurrencyIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const MailIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, avatar_url")
    .eq("id", user.id)
    .single();

  const role = profile?.role as string | undefined;
  if (role && STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number])) {
    redirect("/home");
  }

  const fullName = profile?.full_name ?? null;
  const avatarUrl = profile?.avatar_url ?? null;

  const [linkedPlansResult, plansWherePatientResult, notificationsResult, carePlansResult] =
    await Promise.all([
      supabase
        .from("sponsor_patient_plans")
        .select("id, started_at, care_plan_id, patient_id")
        .eq("sponsor_id", user.id)
        .is("ended_at", null)
        .order("started_at", { ascending: false }),
      supabase
        .from("sponsor_patient_plans")
        .select("id, started_at, care_plan_id, sponsor_id")
        .eq("patient_id", user.id)
        .is("ended_at", null)
        .order("started_at", { ascending: false }),
      supabase
        .from("notifications")
        .select("id, type, title, body, read_at, created_at, reference_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("care_plans").select("id, name, slug, price_cents"),
    ]);

  const linkedPlans = linkedPlansResult.data ?? [];
  const plansWherePatient = plansWherePatientResult.data ?? [];
  const carePlans = carePlansResult.data ?? [];
  const notifications = notificationsResult.data ?? [];

  const patientIds = [...new Set(linkedPlans.map((p) => p.patient_id))];
  const mySponsorIds = [...new Set(plansWherePatient.map((p) => p.sponsor_id))];

  const { data: patientProfiles } =
    patientIds.length > 0
      ? await supabase.from("profiles").select("id, full_name, date_of_birth").in("id", patientIds)
      : { data: [] };
  const { data: mySponsorProfiles } =
    mySponsorIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", mySponsorIds)
      : { data: [] };

  const linkedPatients = linkedPlans.map((p) => {
    const plan = carePlans.find((c) => c.id === p.care_plan_id);
    const patient = patientProfiles?.find((pr) => pr.id === p.patient_id);
    const dob = patient?.date_of_birth;
    const age =
      dob != null
        ? Math.floor(
            (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
          )
        : null;
    return {
      id: p.id,
      started_at: p.started_at,
      care_plan: plan ? { id: plan.id, name: plan.name, slug: plan.slug, price_cents: plan.price_cents } : null,
      patient: patient ? { id: patient.id, full_name: patient.full_name, age } : null,
    };
  });

  const mySponsors = plansWherePatient.map((p) => {
    const plan = carePlans.find((c) => c.id === p.care_plan_id);
    const sponsor = mySponsorProfiles?.find((pr) => pr.id === p.sponsor_id);
    return {
      id: p.id,
      started_at: p.started_at,
      care_plan: plan ? { id: plan.id, name: plan.name } : null,
      sponsor: sponsor ? { id: sponsor.id, full_name: sponsor.full_name } : null,
    };
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-[#E6E15A]/20 blur-3xl" />
        <div className="absolute right-[-10rem] bottom-[-10rem] h-[32rem] w-[48rem] rounded-full bg-[#9CCB4A]/15 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1F5F2E]/5 blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <UserNavbar fullName={fullName} notifications={notifications} />

        <section className="mt-12 flex flex-1 flex-col">
          {/* Hero Section */}
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-[#1F5F2E]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#1F5F2E]">
              Your profile
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Profile & settings
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-600">
            Manage your account information and care connections.
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
            
            {/* Account Info */}
            <div className="mt-8 grid gap-4 border-t border-slate-200 pt-8 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3">
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
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3">
                <div className="rounded-lg bg-white p-2 shadow-sm">
                  <UsersIcon />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Display name
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-slate-900">
                    {fullName ?? "Not set"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Care Connections */}
          <div className="mt-10">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-[#1F5F2E]/10 p-2.5 text-[#1F5F2E]">
                <HeartIcon />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Care connections</h2>
                <p className="mt-0.5 text-sm text-slate-600">
                  Your patients, sponsors, and monthly expenses
                </p>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Patients you sponsor */}
              <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur transition hover:border-[#1F5F2E]/30 hover:shadow-md">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-[#1F5F2E]/20 to-[#9CCB4A]/20 p-3 text-[#1F5F2E]">
                    <UsersIcon />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Patients you sponsor</h3>
                </div>
                {linkedPatients.length === 0 ? (
                  <div className="py-8 text-center">
                    <UsersIcon className="mx-auto h-12 w-12 text-slate-300" />
                    <p className="mt-3 text-sm font-medium text-slate-900">No patients yet</p>
                    <p className="mt-1 text-xs text-slate-500">Start sponsoring care plans</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {linkedPatients.map((link) => (
                      <li key={link.id}>
                        <Link
                          href={`/home/sponsored/${link.id}`}
                          className="group/item flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-3 transition hover:border-[#1F5F2E]/30 hover:bg-white"
                        >
                          <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br from-[#1F5F2E]/20 to-[#9CCB4A]/20 flex items-center justify-center">
                            <UsersIcon className="h-5 w-5 text-[#1F5F2E]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-900">
                              {link.patient?.full_name ?? "Patient"}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                              {link.patient?.age != null && <span>{link.patient.age} years</span>}
                              {link.care_plan && (
                                <>
                                  {link.patient?.age != null && <span>•</span>}
                                  <span>{link.care_plan.name}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <ArrowRightIcon className="h-4 w-4 text-slate-400 transition-transform group-hover/item:translate-x-1" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  href="/home"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#1F5F2E] hover:underline"
                >
                  View dashboard
                  <ArrowRightIcon />
                </Link>
              </div>

              {/* Your sponsors */}
              <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur transition hover:border-[#1F5F2E]/30 hover:shadow-md">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-[#E6E15A]/20 to-[#9CCB4A]/20 p-3 text-[#1F5F2E]">
                    <HeartIcon />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Your sponsors</h3>
                </div>
                {mySponsors.length === 0 ? (
                  <div className="py-8 text-center">
                    <HeartIcon className="mx-auto h-12 w-12 text-slate-300" />
                    <p className="mt-3 text-sm font-medium text-slate-900">No sponsors yet</p>
                    <p className="mt-1 text-xs text-slate-500">Waiting for sponsorship</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {mySponsors.map((link) => (
                      <li
                        key={link.id}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-3"
                      >
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br from-[#E6E15A]/20 to-[#9CCB4A]/20 flex items-center justify-center">
                          <HeartIcon className="h-5 w-5 text-[#1F5F2E]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900">
                            {link.sponsor?.full_name ?? "Sponsor"}
                          </p>
                          {link.care_plan && (
                            <p className="text-xs text-slate-600">{link.care_plan.name}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Monthly expenses */}
              <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur transition hover:border-[#1F5F2E]/30 hover:shadow-md">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-[#1F5F2E]/20 to-[#9CCB4A]/20 p-3 text-[#1F5F2E]">
                    <CurrencyIcon />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Monthly expenses</h3>
                    <p className="text-xs text-slate-500">This month (preview)</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {DUMMY_MONTHLY_EXPENSES.map((item) => (
                    <div
                      key={item.plan}
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2.5"
                    >
                      <span className="text-sm text-slate-700">{item.plan}</span>
                      <span className="font-semibold text-slate-900">${item.amount}</span>
                    </div>
                  ))}
                  <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                    <span className="text-base font-semibold text-slate-900">Total</span>
                    <span className="text-xl font-bold text-[#1F5F2E]">${DUMMY_TOTAL}/mo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sign out */}
          <div className="mt-12 rounded-2xl border border-red-200 bg-red-50/50 p-6">
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
                  <LogoutIcon />
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
