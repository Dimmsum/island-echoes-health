import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserNavbar } from "../../home/UserNavbar";
import { RatingBadge } from "../ProviderCard";
import { fetchProviderDetail } from "../actions";
import { CATEGORY_LABELS } from "../provider-types";

// Live fetch on every view — provider data may not be cached (Google Places licence).
export const dynamic = "force-dynamic";

const STAFF_ROLES = ["admin", "clinician"] as const;

const cardClass = "rounded-2xl border border-[#E9EEE9] bg-white p-[22px]";
const sansStyle = { fontFamily: "var(--font-hanken, 'Hanken Grotesk', sans-serif)" };
const monoStyle = { fontFamily: "var(--font-ibm-mono, 'IBM Plex Mono', monospace)" };
const eyebrowClass = "text-[11px] uppercase tracking-[.12em] text-[#8a988f]";

type Props = { params: Promise<{ placeId: string }> };

export default async function ProviderDetailPage({ params }: Props) {
  const { placeId } = await params;

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
  const fullName = profile?.full_name ?? null;

  if (role && STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number])) {
    redirect("/clinician-portal");
  }

  const { provider, error } = await fetchProviderDetail(placeId);

  return (
    <div className="min-h-screen bg-[#F4F7F3]" style={sansStyle}>
      <UserNavbar fullName={fullName} notifications={[]} activePath="/recommendations" />

      <main className="mx-auto max-w-[760px] px-7 py-8">
        <Link href="/recommendations" className="text-[13px] font-semibold text-[#1F8A5B] hover:underline">
          ← Back to recommendations
        </Link>

        <div className={`mt-4 ${cardClass}`}>
          {!provider ? (
            <p className="py-8 text-center text-[13px] text-[#94a298]">
              {error ?? "We couldn't find that provider."}
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[22px] font-semibold text-[#16241D]">{provider.name}</h1>
                {provider.categories.map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-[#F4F7F3] px-2.5 py-1 text-[11px] font-medium text-[#6a7a70]"
                  >
                    {CATEGORY_LABELS[c]}
                  </span>
                ))}
              </div>

              <div className="mt-2.5">
                <RatingBadge provider={provider} />
              </div>

              <dl className="mt-5 space-y-4">
                <div>
                  <dt className={eyebrowClass} style={monoStyle}>
                    Address
                  </dt>
                  <dd className="mt-1 text-[14px] text-[#5a6a60]">
                    {provider.address ?? <span className="text-[#94a298]">No address listed</span>}
                  </dd>
                </div>
                <div>
                  <dt className={eyebrowClass} style={monoStyle}>
                    Phone
                  </dt>
                  <dd className="mt-1 text-[14px]">
                    {provider.phone ? (
                      <a href={`tel:${provider.phone}`} className="font-semibold text-[#1F8A5B] hover:underline">
                        {provider.phone}
                      </a>
                    ) : (
                      <span className="text-[#94a298]">No phone number listed</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className={eyebrowClass} style={monoStyle}>
                    Website
                  </dt>
                  <dd className="mt-1 text-[14px]">
                    {provider.website ? (
                      <a
                        href={provider.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-[#1F8A5B] hover:underline"
                      >
                        {provider.website}
                      </a>
                    ) : (
                      <span className="text-[#94a298]">No website listed</span>
                    )}
                  </dd>
                </div>
              </dl>

              {provider.googleMapsUri && (
                <a
                  href={provider.googleMapsUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-block rounded-[10px] bg-[#1F8A5B] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#17764e]"
                >
                  View &amp; rate on Google
                </a>
              )}

              <p className="mt-4 text-[12px] text-[#94a298]">
                Details and ratings are provided live by Google. Reviews are left on Google, not here.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
