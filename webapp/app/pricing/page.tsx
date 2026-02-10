export default function PricingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-4 py-20 text-slate-800">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">Pricing</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          Simple, transparent pricing designed for teams of all sizes. Contact us for enterprise
          options or custom integrations.
        </p>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-emerald-900">Starter</h2>
          <p className="mt-1 text-xs text-slate-600">For smaller practices exploring Island Echoes.</p>
        </div>
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50/80 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-emerald-900">Clinic</h2>
          <p className="mt-1 text-xs text-slate-600">
            For growing care teams that need coordination at scale.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-emerald-900">Enterprise</h2>
          <p className="mt-1 text-xs text-slate-600">
            Tailored deployments, advanced security, and integrations.
          </p>
        </div>
      </section>
    </main>
  );
}
