import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserNavbar } from "../UserNavbar";

const STAFF_ROLES = ["admin", "clinician"] as const;

// Dummy monthly expense data for UI preview
const DUMMY_MONTHLY_EXPENSES = [
  { plan: "Core Wellness", amount: 75 },
  { plan: "Chronic Care", amount: 120 },
];
const DUMMY_TOTAL = DUMMY_MONTHLY_EXPENSES.reduce((s, x) => s + x.amount, 0);

const UserIcon = () => (
  <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const MailIcon = () => (
  <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

const UsersIcon = () => (
  <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const HeartIcon = () => (
  <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
    />
  </svg>
);

const CurrencyIcon = () => (
  <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const LogoutIcon = () => (
  <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
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
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  const role = profile?.role as string | undefined;
  if (role && STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number])) {
    redirect("/home");
  }

  const fullName = profile?.full_name ?? null;

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
    <div className="relative min-h-screen overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-80 w-80 rounded-full bg-[#E6E15A]/25 blur-3xl" />
        <div className="absolute right-[-10rem] bottom-[-10rem] h-[26rem] w-[40rem] rounded-full bg-[#9CCB4A]/30 blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-8 sm:py-8">
        <UserNavbar fullName={fullName} notifications={notifications} />

        <section className="mt-12 flex flex-1 flex-col">
          <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
          <p className="mt-1 text-slate-600">
            Your account and care connections.
          </p>

          {/* Profile overview */}
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Profile overview
            </h2>
            <dl className="mt-4 space-y-4 sm:flex sm:flex-wrap sm:gap-x-8 sm:gap-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-slate-100 p-2">
                  <UserIcon />
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Name
                  </dt>
                  <dd className="mt-0.5 text-base font-medium text-slate-900">
                    {fullName ?? "—"}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-slate-100 p-2">
                  <MailIcon />
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Email
                  </dt>
                  <dd className="mt-0.5 text-base font-medium text-slate-900">
                    {user.email ?? "—"}
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          {/* Cards */}
          <h2 className="mt-12 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Care connections & expenses
          </h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Patients you sponsor */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
              <div className="flex items-center gap-2 text-slate-900">
                <div className="rounded-lg bg-[#1F5F2E]/10 p-2">
                  <UsersIcon />
                </div>
                <h3 className="text-base font-semibold">Patients you sponsor</h3>
              </div>
              {linkedPatients.length === 0 ? (
                <p className="mt-4 flex-1 text-sm text-slate-500">No patients yet.</p>
              ) : (
                <ul className="mt-4 flex-1 space-y-2">
                  {linkedPatients.map((link) => (
                    <li key={link.id}>
                      <Link
                        href={`/home/sponsored/${link.id}`}
                        className="block rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2.5 text-sm transition hover:border-[#1F5F2E]/30 hover:bg-slate-50"
                      >
                        <span className="font-medium text-slate-900">
                          {link.patient?.full_name ?? "Patient"}
                        </span>
                        {link.patient?.age != null && (
                          <span className="ml-1 text-slate-500">({link.patient.age})</span>
                        )}
                        {link.care_plan && (
                          <span className="mt-0.5 block text-xs text-slate-600">
                            {link.care_plan.name}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/home"
                className="mt-4 text-sm font-medium text-[#1F5F2E] hover:underline"
              >
                View dashboard →
              </Link>
            </div>

            {/* Your sponsors */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
              <div className="flex items-center gap-2 text-slate-900">
                <div className="rounded-lg bg-[#1F5F2E]/10 p-2">
                  <HeartIcon />
                </div>
                <h3 className="text-base font-semibold">Your sponsors</h3>
              </div>
              {mySponsors.length === 0 ? (
                <p className="mt-4 flex-1 text-sm text-slate-500">No sponsors yet.</p>
              ) : (
                <ul className="mt-4 flex-1 space-y-2">
                  {mySponsors.map((link) => (
                    <li
                      key={link.id}
                      className="rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2.5"
                    >
                      <span className="font-medium text-slate-900">
                        {link.sponsor?.full_name ?? "Sponsor"}
                      </span>
                      {link.care_plan && (
                        <span className="mt-0.5 block text-xs text-slate-600">
                          {link.care_plan.name}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Monthly expense breakdown (dummy) */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
              <div className="flex items-center gap-2 text-slate-900">
                <div className="rounded-lg bg-[#1F5F2E]/10 p-2">
                  <CurrencyIcon />
                </div>
                <h3 className="text-base font-semibold">Monthly expenses</h3>
              </div>
              <p className="mt-1 text-xs text-slate-500">This month (preview)</p>
              <div className="mt-4 flex-1">
                <ul className="space-y-2">
                  {DUMMY_MONTHLY_EXPENSES.map((item) => (
                    <li
                      key={item.plan}
                      className="flex items-center justify-between text-sm text-slate-700"
                    >
                      <span>{item.plan}</span>
                      <span className="font-medium">${item.amount}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="text-sm font-semibold text-slate-900">Total</span>
                  <span className="font-semibold text-slate-900">${DUMMY_TOTAL}/mo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sign out */}
          <div className="mt-12 border-t border-slate-200 pt-8">
            <form action="/auth/signout" method="post">
              <input type="hidden" name="redirectTo" value="/" />
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 sm:w-auto"
              >
                <LogoutIcon />
                Sign out of my account
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
