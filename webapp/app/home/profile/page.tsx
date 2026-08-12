import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchApiJson } from "@/lib/api";
import { UserNavbar } from "../UserNavbar";
import { ProfileEditForm } from "./ProfileEditForm";
import { EditableDisplayName } from "./EditableDisplayName";
import { EndSponsorshipButton } from "../EndSponsorshipButton";

const STAFF_ROLES = ["admin", "clinician"] as const;

const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className || "h-6 w-6"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const HeartIcon = ({ className }: { className?: string }) => (
  <svg className={className || "h-6 w-6"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const CurrencyIcon = ({ className }: { className?: string }) => (
  <svg className={className || "h-6 w-6"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const MailIcon = ({ className }: { className?: string }) => (
  <svg className={className || "h-5 w-5"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PhoneIcon = ({ className }: { className?: string }) => (
  <svg className={className || "h-5 w-5"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className || "h-6 w-6"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg className={className || "h-5 w-5"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) redirect("/");

  const [meData, homeProfileData] = await Promise.all([
    fetchApiJson<{ user: { id: string; email: string | null }; profile: { role?: string; full_name: string | null; avatar_url: string | null; phone: string | null } | null }>(
      session.access_token,
      "/api/me"
    ),
    fetchApiJson<{
      linkedPatients: { id: string; started_at: string; care_plan: { id: string; name: string; slug: string; price_cents: number } | null; patient: { id: string; full_name: string; age: number | null; avatar_url: string | null } | null }[];
      mySponsors: { id: string; started_at: string; care_plan: { id: string; name: string; slug: string; price_cents: number } | null; sponsor: { id: string; full_name: string; avatar_url: string | null } | null }[];
      notifications: Parameters<typeof UserNavbar>[0]["notifications"];
      carePlans: { id: string; name: string; slug: string; price_cents: number }[];
    }>(session.access_token, "/api/home/profile"),
  ]);

  const role = meData.profile?.role as string | undefined;
  if (role && STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number])) {
    redirect("/home");
  }

  const fullName = meData.profile?.full_name ?? null;
  const avatarUrl = meData.profile?.avatar_url ?? null;
  const phone = meData.profile?.phone ?? null;
  const user = meData.user;
  const { linkedPatients, mySponsors, notifications } = homeProfileData;

  // Monthly expenses from active sponsorships (DB: sponsor_patient_plans + care_plans.price_cents)
  const monthlyExpenses = linkedPatients
    .filter((link) => link.care_plan != null)
    .map((link) => ({
      id: link.id,
      plan: link.care_plan!.name,
      amountCents: link.care_plan!.price_cents,
      amountDollars: link.care_plan!.price_cents / 100,
    }));
  const totalMonthlyCents = monthlyExpenses.reduce((sum, x) => sum + x.amountCents, 0);
  const totalMonthlyDollars = totalMonthlyCents / 100;

  return (
    <div className="min-h-screen bg-[#F4F7F3]">
      <UserNavbar fullName={fullName} notifications={notifications} activePath="/home/profile" />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="flex flex-col">
          {/* Hero */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="rounded-full bg-[#1F5F2E]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#1F5F2E]">
                Your profile
              </span>
              <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Profile &amp; settings
              </h1>
              <p className="mt-3 max-w-2xl text-lg text-slate-600">
                Manage your account information and care connections.
              </p>
            </div>
            {/* Account status (static) */}
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <div className="rounded-xl bg-[#EFF6F1] p-2 text-[#1F5F2E]">
                <CheckCircleIcon />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Account active</p>
                <p className="text-xs text-slate-500">Your account is in good standing.</p>
              </div>
            </div>
          </div>

          {/* Personal information */}
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-[#EFF6F1] p-2.5 text-[#1F5F2E]">
                <UsersIcon />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Personal information</h2>
                <p className="mt-0.5 text-sm text-slate-600">
                  Update your profile photo and personal details.
                </p>
              </div>
            </div>
            <ProfileEditForm initialAvatarUrl={avatarUrl} />

            {/* Field tiles */}
            <div className="mt-8 grid gap-4 border-t border-slate-200 pt-8 sm:grid-cols-2">
              <EditableDisplayName initialName={fullName} />

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="rounded-lg bg-[#EFF6F1] p-2 text-[#1F5F2E]">
                  <MailIcon />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Email address
                  </p>
                  <p className="mt-0.5 truncate text-sm font-medium text-slate-900">
                    {user.email ?? "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="rounded-lg bg-[#EFF6F1] p-2 text-[#1F5F2E]">
                  <PhoneIcon />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Phone number
                  </p>
                  <p className="mt-0.5 truncate text-sm font-medium text-slate-900">
                    {phone ?? "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Care connections */}
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-[#EFF6F1] p-2.5 text-[#1F5F2E]">
                <HeartIcon />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Care connections</h2>
                <p className="mt-0.5 text-sm text-slate-600">
                  Manage your patients, sponsors, and monthly expenses.
                </p>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Patients you sponsor */}
              <div className="rounded-2xl border border-slate-200 bg-[#F4F7F3] p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-xl bg-[#DCEFE3] p-2.5 text-[#1F5F2E]">
                    <UsersIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Patients you sponsor</h3>
                    <p className="text-xs text-slate-500">View and manage patients under your care.</p>
                  </div>
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
                          className="group/item flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-3 transition hover:border-[#1F5F2E]/30"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#DCEFE3]">
                            {link.patient?.avatar_url ? (
                              <img src={link.patient.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <UsersIcon className="h-5 w-5 text-[#1F5F2E]" />
                            )}
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
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>

              {/* Your sponsors */}
              <div className="rounded-2xl border border-slate-200 bg-[#F4F7F3] p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-xl bg-[#DCEFE3] p-2.5 text-[#1F5F2E]">
                    <HeartIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Your sponsors</h3>
                    <p className="text-xs text-slate-500">Sponsors who support your care work.</p>
                  </div>
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
                        className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-3"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#DCEFE3]">
                          {link.sponsor?.avatar_url ? (
                            <img src={link.sponsor.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <HeartIcon className="h-5 w-5 text-[#1F5F2E]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900">
                            {link.sponsor?.full_name ?? "Sponsor"}
                          </p>
                          {link.care_plan && (
                            <p className="text-xs text-slate-600">{link.care_plan.name}</p>
                          )}
                        </div>
                        <EndSponsorshipButton
                          planId={link.id}
                          label="Opt out"
                          variant="ghost"
                        />
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  href="/home"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#1F5F2E] hover:underline"
                >
                  View all sponsors
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>

              {/* Monthly expenses (from active sponsorships in DB) */}
              <div className="rounded-2xl border border-slate-200 bg-[#F4F7F3] p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-xl bg-[#DCEFE3] p-2.5 text-[#1F5F2E]">
                    <CurrencyIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Monthly expenses</h3>
                    <p className="text-xs text-slate-500">Overview of your active sponsorships.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {monthlyExpenses.length === 0 ? (
                    <div className="py-6 text-center">
                      <CurrencyIcon className="mx-auto h-10 w-10 text-slate-300" />
                      <p className="mt-2 text-sm font-medium text-slate-900">No active sponsorships</p>
                      <p className="mt-1 text-xs text-slate-500">Sponsor a care plan to see costs here</p>
                    </div>
                  ) : (
                    <>
                      {monthlyExpenses.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2.5"
                        >
                          <span className="text-sm text-slate-700">{item.plan}</span>
                          <span className="font-semibold text-slate-900">${item.amountDollars.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                        <span className="text-base font-semibold text-slate-900">Total</span>
                        <span className="text-xl font-bold text-[#1F5F2E]">${totalMonthlyDollars.toFixed(2)}/mo</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
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
