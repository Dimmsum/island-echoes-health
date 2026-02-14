import Image from "next/image";
import Link from "next/link";

type PatientWithPlan = {
  patient_id: string;
  patient_name: string | null;
  plan_name: string;
  next_appointment: string | null;
};

type Props = {
  fullName: string | null;
  role: "admin" | "clinician";
  patientsWithPlans: PatientWithPlan[];
};

export function ClinicianHome({
  fullName,
  role,
  patientsWithPlans,
}: Props) {
  const greeting = fullName ? `Welcome back, ${fullName}` : "Welcome back";
  const roleLabel = role === "clinician" ? "Clinician" : "Admin";

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
            <Link href="/home/appointments" className="hover:text-[#1F5F2E]">
              Appointments
            </Link>
            {role === "admin" && (
              <Link href="/admin" className="hover:text-[#1F5F2E]">
                Admin
              </Link>
            )}
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
            {roleLabel} Portal
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {greeting}
          </h1>
          <p className="mt-4 max-w-2xl text-slate-600">
            Manage patients and appointments. View today&apos;s schedule and patient plans.
          </p>

          <div className="mt-10">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Current patients and plans
              </h2>
              <Link
                href="/home/appointments"
                className="rounded-full bg-[#1F5F2E] px-4 py-2 text-sm font-medium text-white hover:bg-[#174622]"
              >
                Manage appointments
              </Link>
            </div>
            {patientsWithPlans.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                No patients with active plans yet. When sponsors purchase plans and patients accept, they will appear here.
              </p>
            ) : (
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Patient
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Plan
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Next appointment
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {patientsWithPlans.map((row) => (
                      <tr key={row.patient_id} className="transition hover:bg-slate-50/50">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                          {row.patient_name ?? "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {row.plan_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {row.next_appointment
                            ? new Date(row.next_appointment).toLocaleString()
                            : "—"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/home/appointments?patient=${row.patient_id}`}
                            className="text-sm font-medium text-[#1F5F2E] hover:underline"
                          >
                            Schedule
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
