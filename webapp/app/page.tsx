import Image from "next/image";
import Link from "next/link";

export default function Home() {
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
          <div className="flex items-center gap-3">
            <Image
              src="/island-echoes-health.svg"
              alt="Island Echoes Health"
              width={140}
              height={50}
              priority
            />
          </div>

          <nav className="flex items-center gap-4 text-sm font-medium text-slate-900 sm:gap-6">
            <Link href="/about" className="hover:text-[#1F5F2E]">
              About
            </Link>
            <Link href="/pricing" className="hover:text-[#1F5F2E]">
              Pricing
            </Link>
            <div className="hidden h-6 w-px bg-slate-300/70 sm:block" />
            <Link href="/login" className="text-slate-800 hover:text-[#1F5F2E]">
              Log in
            </Link>
            <Link
              href="/signup"
              className="hidden rounded-full bg-[#1F5F2E] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#174622] sm:inline-block"
            >
              Sign up
            </Link>
          </nav>
        </header>

        <section className="mt-16 flex w-full flex-1 flex-col items-center text-center md:mt-20">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#1F5F2E]">
            Care that echoes across oceans
          </p>
          <h1 className="mt-6 max-w-3xl text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            A calm way to stay connected through every stage of care.
          </h1>

          <p className="mt-6 max-w-2xl text-pretty text-base text-slate-800 sm:text-lg">
            Simple tools that bring patients, families, and clinicians together.
            Secure messaging, clear updates, and coordinated support—without the
            noise.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <div className="flex items-center gap-6">
              <button className="rounded-full bg-[#1F5F2E] px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#174622]">
                I am a User
              </button>
              <button className="rounded-full border border-[#1F5F2E] bg-white px-8 py-3 text-sm font-semibold text-[#1F5F2E] shadow-sm transition hover:bg-[#E6E15A]/10">
                I am a Clinician
              </button>
            </div>
          </div>

          <div className="mt-16 grid w-full max-w-4xl gap-8 text-left text-sm text-slate-800 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#1F5F2E]">
                For patients & families
              </p>
              <p className="text-base font-semibold text-slate-900">
                Know what&apos;s next, without chasing updates.
              </p>
              <p className="text-xs leading-relaxed text-slate-600">
                Appointment reminders, simple summaries, and one calm place to follow the plan of
                care—whether you&apos;re across town or across an ocean.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#1F5F2E]">
                For clinicians
              </p>
              <p className="text-base font-semibold text-slate-900">
                Communication that fits into real workflows.
              </p>
              <p className="text-xs leading-relaxed text-slate-600">
                Structured updates, fewer repeated questions, and clear threads that keep the whole
                care team aligned without adding more noise.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#1F5F2E]">
                For organizations
              </p>
              <p className="text-base font-semibold text-slate-900">
                A shared story of each care journey.
              </p>
              <p className="text-xs leading-relaxed text-slate-600">
                High-level trends, transparent costs, and a record of communication that helps your
                team learn, adapt, and support families over time.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
