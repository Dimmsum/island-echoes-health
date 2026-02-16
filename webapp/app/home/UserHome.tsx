import Image from "next/image";
import Link from "next/link";
import { ConsentRequestCards } from "./ConsentRequestCards";
import { NotificationList } from "./NotificationList";
import { PurchasePlanForm } from "./PurchasePlanForm";

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
    <div className="relative min-h-screen overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-80 w-80 rounded-full bg-[#E6E15A]/25 blur-3xl" />
        <div className="absolute right-[-10rem] bottom-[-10rem] h-[26rem] w-[40rem] rounded-full bg-[#9CCB4A]/30 blur-3xl" />
        <div className="absolute -left-32 bottom-[-8rem] h-72 w-[36rem] rounded-full bg-[#9CCB4A]/18 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#1F5F2E]/5 to-transparent" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-8 sm:py-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/home" className="flex items-center gap-3">
            <Image
              src="/island-echoes-health.svg"
              alt="Island Echoes Health"
              width={140}
              height={50}
              priority
            />
          </Link>

          <nav className="flex items-center gap-4 text-sm font-medium text-slate-900 sm:gap-6">
            <NotificationList notifications={notifications} />
            <Link href="/about" className="hover:text-[#1F5F2E]">
              About
            </Link>
            <Link href="/pricing" className="hover:text-[#1F5F2E]">
              Pricing
            </Link>
            <form action="/auth/signout" method="post">
              <input type="hidden" name="redirectTo" value="/" />
              <button type="submit" className="hover:text-[#1F5F2E]">
                Sign out
              </button>
            </form>
          </nav>
        </header>

        <section className="mt-16 flex w-full flex-1 flex-col md:mt-20">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#1F5F2E]">
            Your care journey
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {greeting}
          </h1>
          <p className="mt-4 max-w-2xl text-slate-600">
            Stay connected with your care team. View upcoming appointments and your plan of care.
          </p>

          {pendingConsents.length > 0 && (
            <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50/50 p-6">
              <ConsentRequestCards requests={pendingConsents} />
            </div>
          )}

          {hasSponsors && (
            <div className="mt-10 rounded-2xl border border-slate-200 bg-white/80 p-6 backdrop-blur">
              <h2 className="text-lg font-semibold text-slate-900">Your sponsors</h2>
              <p className="mt-1 text-sm text-slate-600">
                People supporting your care through purchased plans.
              </p>
              <ul className="mt-4 flex flex-wrap gap-3">
                {mySponsors.map((link) => (
                  <li
                    key={link.id}
                    className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                  >
                    <span className="font-medium text-slate-900">
                      {link.sponsor?.full_name ?? "Sponsor"}
                    </span>
                    {link.care_plan && (
                      <span className="ml-2 text-sm text-slate-600">
                        — {link.care_plan.name}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!hasLinkedPatients && (
            <div className="mt-10 rounded-2xl border border-slate-200 bg-white/80 p-6 backdrop-blur">
              <h2 className="text-lg font-semibold text-slate-900">
                Purchase a plan for a patient
              </h2>
              <div className="mt-4">
                <PurchasePlanForm carePlans={carePlans} />
              </div>
            </div>
          )}

          {hasLinkedPatients && (
            <div className="mt-10">
              <h2 className="text-lg font-semibold text-slate-900">Linked patients</h2>
              <p className="mt-1 text-sm text-slate-600">
                View metrics, appointments, and visit summaries for patients you sponsor.
              </p>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {linkedPatients.map((link) => (
                  <li key={link.id}>
                    <Link
                      href={`/home/sponsored/${link.id}`}
                      className="block rounded-2xl border border-slate-200 bg-white/80 p-6 backdrop-blur transition hover:border-[#1F5F2E]/30 hover:shadow-md"
                    >
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
                      <p className="mt-2 text-xs text-[#1F5F2E]">View details →</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900">Upcoming appointments</h2>
            {upcomingAppointments.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">No upcoming appointments.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {upcomingAppointments.map((apt) => (
                  <li
                    key={apt.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/80 px-4 py-3"
                  >
                    <span className="text-sm text-slate-900">
                      {new Date(apt.scheduled_at).toLocaleString()}
                      {apt.clinician_name && (
                        <span className="ml-2 text-slate-600">with {apt.clinician_name}</span>
                      )}
                    </span>
                    <span className="text-xs text-slate-500 capitalize">{apt.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
