import Image from "next/image";
import Link from "next/link";

type Props = {
  fullName: string | null;
  role: "front_desk" | "clinician";
};

export function ClinicianHome({ fullName, role }: Props) {
  const greeting = fullName ? `Welcome back, ${fullName}` : "Welcome back";
  const roleLabel = role === "clinician" ? "Clinician" : "Front desk";

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-80 w-80 rounded-full bg-[#E6E15A]/25 blur-3xl" />
        <div className="absolute right-[-10rem] bottom-[-10rem] h-[26rem] w-[40rem] rounded-full bg-[#9CCB4A]/30 blur-3xl" />
        <div className="absolute -left-32 bottom-[-8rem] h-72 w-[36rem] rounded-full bg-[#9CCB4A]/18 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#1F5F2E]/5 to-transparent" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-8 sm:py-8">
        <header className="flex items-center justify-between">
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
            <Link href="/about" className="hover:text-[#1F5F2E]">
              About
            </Link>
            <Link href="/pricing" className="hover:text-[#1F5F2E]">
              Pricing
            </Link>
            <form action="/auth/signout" method="post">
              <input type="hidden" name="redirectTo" value="/" />
              <button
                type="submit"
                className="hover:text-[#1F5F2E]"
              >
                Sign out
              </button>
            </form>
          </nav>
        </header>

        <section className="mt-16 flex w-full flex-1 flex-col md:mt-20">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#1F5F2E]">
            {roleLabel} Portal
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {greeting}
          </h1>
          <p className="mt-4 max-w-2xl text-slate-600">
            Access patient communication, appointment schedules, and your team&apos;s shared dashboard.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 backdrop-blur">
              <h2 className="text-lg font-semibold text-slate-900">
                Today&apos;s schedule
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                View and manage today&apos;s appointments.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 backdrop-blur">
              <h2 className="text-lg font-semibold text-slate-900">
                Patients
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Manage patient records and communication.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 backdrop-blur">
              <h2 className="text-lg font-semibold text-slate-900">
                Team dashboard
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Collaborate with your care team.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
