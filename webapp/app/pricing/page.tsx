import Link from "next/link";

const CARE_PLANS: Array<{
  slug: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  description: string;
  highlighted?: boolean;
}> = [
  {
    slug: "core_wellness",
    name: "Core Wellness",
    price: 75,
    interval: "month",
    features: [
      "1 clinic visit per month",
      "Vitals taken each visit",
      "Labs not included",
      "Basic wellness and follow-ups",
    ],
    description: "Essential care for your wellness journey.",
  },
  {
    slug: "chronic_care",
    name: "Chronic Care",
    price: 120,
    interval: "month",
    features: [
      "1 clinic visit per month",
      "Vitals taken each visit",
      "1 chronic lab per quarter",
      "Basic wellness, diabetes, hypertension",
    ],
    description: "Structured support for chronic conditions.",
    highlighted: true,
  },
  {
    slug: "premium_coordination",
    name: "Premium Coordination",
    price: 180,
    interval: "month",
    features: [
      "2 clinic visits per month",
      "Vitals taken each visit",
      "1 chronic lab per quarter",
      "Extra coordination and support",
    ],
    description: "More visits and dedicated coordination.",
  },
];

export default function PricingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-4 py-20 text-slate-800">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Care plans
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          Choose a plan for yourself or a family member. Sponsors can purchase a
          plan for a patient; the patient will receive a consent request to accept
          or decline.
        </p>
        <p className="mt-4">
          <Link
            href="/user"
            className="text-sm font-medium text-[#1F5F2E] hover:underline"
          >
            Sign in
          </Link>
          <span className="mx-2 text-slate-400">|</span>
          <Link
            href="/home"
            className="text-sm font-medium text-[#1F5F2E] hover:underline"
          >
            Go to dashboard
          </Link>
        </p>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {CARE_PLANS.map((plan) => (
          <div
            key={plan.slug}
            className={`rounded-2xl border p-6 ${
              plan.highlighted
                ? "border-[#1F5F2E] bg-[#1F5F2E]/5 shadow-md"
                : "border-slate-200 bg-white/80 shadow-sm"
            }`}
          >
            <h2 className="text-lg font-semibold text-slate-900">{plan.name}</h2>
            <p className="mt-1 text-sm text-slate-600">{plan.description}</p>
            <p className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-semibold text-slate-900">
                ${plan.price}
              </span>
              <span className="text-sm text-slate-500">/{plan.interval}</span>
            </p>
            <ul className="mt-6 space-y-2">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-slate-700"
                >
                  <span className="mt-0.5 text-[#1F5F2E]" aria-hidden>
                    ✓
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </main>
  );
}
