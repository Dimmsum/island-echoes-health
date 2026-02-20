import Link from "next/link";
import { ConsentRequestCards } from "./ConsentRequestCards";
import { PurchasePlanForm } from "./PurchasePlanForm";
import { UserNavbar } from "./UserNavbar";

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className || "h-6 w-6"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

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

const GiftIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
  </svg>
);

const ClockIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

type LinkedPatient = {
  id: string;
  started_at: string;
  care_plan: { id: string; name: string; slug: string; price_cents: number } | null;
  patient: { id: string; full_name: string | null; age: number | null } | null;
};

type MySponsor = {
  id: string;
  started_at: string;
  care_plan: { id: string; name: string } | null;
  sponsor: { id: string; full_name: string | null } | null;
};

type PendingConsent = {
  id: string;
  patient_email: string;
  care_plan: { id: string; name: string } | null;
  sponsor_name: string;
};

type Appointment = {
  id: string;
  scheduled_at: string;
  status: string;
  clinician_name: string | null;
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

type CarePlan = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  features: string[] | null;
};

type Props = {
  fullName: string | null;
  linkedPatients: LinkedPatient[];
  mySponsors: MySponsor[];
  pendingConsents: PendingConsent[];
  upcomingAppointments: Appointment[];
  notifications: Notification[];
  carePlans: CarePlan[];
};

export function UserHome({
  fullName,
  linkedPatients,
  mySponsors,
  pendingConsents,
  upcomingAppointments,
  notifications,
  carePlans,
}: Props) {
  const greeting = fullName ? `Welcome back, ${fullName}` : "Welcome back";
  const hasLinkedPatients = linkedPatients.length > 0;
  const hasSponsors = mySponsors.length > 0;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-[#E6E15A]/20 blur-3xl" />
        <div className="absolute right-[-10rem] bottom-[-10rem] h-[32rem] w-[48rem] rounded-full bg-[#9CCB4A]/15 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1F5F2E]/5 blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <UserNavbar fullName={fullName} notifications={notifications} />

        <section className="mt-12 flex w-full flex-1 flex-col sm:mt-16">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-[#1F5F2E]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#1F5F2E]">
              Your care journey
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {greeting}
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-600">
            Stay connected with your care team. View upcoming appointments and your plan of care.
          </p>

          {pendingConsents.length > 0 && (
            <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50/50 p-6">
              <ConsentRequestCards requests={pendingConsents} />
            </div>
          )}

          {hasSponsors && (
            <div className="mt-10 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#1F5F2E]/10 p-2.5 text-[#1F5F2E]">
                  <GiftIcon />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Your sponsors</h2>
                  <p className="mt-0.5 text-sm text-slate-600">
                    People supporting your care through purchased plans
                  </p>
                </div>
              </div>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {mySponsors.map((link) => (
                  <li
                    key={link.id}
                    className="group rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-[#1F5F2E]/30 hover:shadow-md"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 shrink-0 rounded-full bg-[#1F5F2E]/10 flex items-center justify-center">
                        <HeartIcon className="h-4 w-4 text-[#1F5F2E]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900">
                          {link.sponsor?.full_name ?? "Sponsor"}
                        </p>
                        {link.care_plan && (
                          <p className="text-sm text-slate-600">{link.care_plan.name}</p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!hasLinkedPatients && (
            <div className="mt-10 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#1F5F2E]/10 p-2.5 text-[#1F5F2E]">
                  <UsersIcon />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Purchase a plan for a patient
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-600">
                    Get started by selecting a care plan
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <PurchasePlanForm carePlans={carePlans} />
              </div>
            </div>
          )}

          {hasLinkedPatients && (
            <div id="patients" className="mt-10 scroll-mt-8">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#1F5F2E]/10 p-2.5 text-[#1F5F2E]">
                  <UsersIcon />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Linked patients</h2>
                  <p className="mt-0.5 text-sm text-slate-600">
                    View metrics, appointments, and visit summaries for patients you sponsor
                  </p>
                </div>
              </div>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {linkedPatients.map((link) => (
                  <li key={link.id}>
                    <Link
                      href={`/home/sponsored/${link.id}`}
                      className="group block rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur transition hover:border-[#1F5F2E]/30 hover:shadow-lg"
                    >
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-[#1F5F2E]/20 to-[#9CCB4A]/20 flex items-center justify-center">
                          <UsersIcon className="h-6 w-6 text-[#1F5F2E]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-slate-900">
                            {link.patient?.full_name ?? "Patient"}
                            {link.patient?.age != null && (
                              <span className="ml-2 font-normal text-slate-500">
                                ({link.patient.age} years)
                              </span>
                            )}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">
                            {link.care_plan?.name ?? "Plan"}
                          </p>
                          <div className="mt-3 flex items-center gap-1 text-sm font-medium text-[#1F5F2E]">
                            <span>View details</span>
                            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-10">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#1F5F2E]/10 p-2.5 text-[#1F5F2E]">
                <CalendarIcon />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Upcoming appointments</h2>
                <p className="mt-0.5 text-sm text-slate-600">
                  Your scheduled visits and consultations
                </p>
              </div>
            </div>
            {upcomingAppointments.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white/50 p-8 text-center">
                <CalendarIcon className="mx-auto h-12 w-12 text-slate-400" />
                <p className="mt-3 text-sm font-medium text-slate-900">No upcoming appointments</p>
                <p className="mt-1 text-sm text-slate-500">Your scheduled visits will appear here</p>
              </div>
            ) : (
              <ul className="mt-6 space-y-3">
                {upcomingAppointments.map((apt) => {
                  const date = new Date(apt.scheduled_at);
                  const isToday = date.toDateString() === new Date().toDateString();
                  return (
                    <li
                      key={apt.id}
                      className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm transition hover:border-[#1F5F2E]/30 hover:shadow-md"
                    >
                      <div className="h-12 w-12 shrink-0 rounded-xl bg-[#1F5F2E]/10 flex items-center justify-center">
                        <CalendarIcon className="h-6 w-6 text-[#1F5F2E]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900">
                            {date.toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                            {isToday && (
                              <span className="ml-2 rounded-full bg-[#1F5F2E] px-2 py-0.5 text-xs font-medium text-white">
                                Today
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                          <ClockIcon />
                          <span>
                            {date.toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                          {apt.clinician_name && (
                            <>
                              <span className="text-slate-400">•</span>
                              <span>with {apt.clinician_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-700">
                        {apt.status}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
