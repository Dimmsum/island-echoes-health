import Link from "next/link";
import { CATEGORY_LABELS, formatDistance, type Provider } from "./provider-types";

/** Star + count. Renders an explicit "No rating yet" rather than nothing. */
export function RatingBadge({ provider }: { provider: Provider }) {
  if (provider.rating === null) {
    return <span className="text-[12px] text-[#94a298]">No rating yet</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center gap-1 rounded-full bg-[#FBF3DC] px-2 py-0.5 text-[12px] font-semibold text-[#8a6d1f]">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
        </svg>
        {provider.rating.toFixed(1)}
      </span>
      {provider.userRatingCount !== null && (
        <span className="text-[12px] text-[#94a298]">
          {provider.userRatingCount.toLocaleString()} review
          {provider.userRatingCount === 1 ? "" : "s"}
        </span>
      )}
    </span>
  );
}

export function ProviderCard({ provider }: { provider: Provider }) {
  const distance = formatDistance(provider.distanceMeters);
  const closed = provider.businessStatus && provider.businessStatus !== "OPERATIONAL";

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-[220px] flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/recommendations/${encodeURIComponent(provider.placeId)}`}
            className="text-[15px] font-semibold text-[#16241D] hover:text-[#1F8A5B]"
          >
            {provider.name}
          </Link>
          {provider.categories.map((c) => (
            <span
              key={c}
              className="rounded-full bg-[#F4F7F3] px-2.5 py-0.5 text-[11px] font-medium text-[#6a7a70]"
            >
              {CATEGORY_LABELS[c]}
            </span>
          ))}
          {closed && (
            <span className="rounded-full bg-[#FBE9E9] px-2.5 py-0.5 text-[11px] font-medium text-[#9b3636]">
              Permanently closed
            </span>
          )}
        </div>

        <div className="mt-1.5">
          <RatingBadge provider={provider} />
        </div>

        {provider.address && (
          <p className="mt-1.5 text-[13px] text-[#5a6a60]">
            {provider.address}
            {distance && <span className="text-[#94a298]"> · {distance} away</span>}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px]">
          {provider.phone && (
            <a href={`tel:${provider.phone}`} className="font-semibold text-[#1F8A5B] hover:underline">
              {provider.phone}
            </a>
          )}
          {provider.website && (
            <a
              href={provider.website}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#1F8A5B] hover:underline"
            >
              Website
            </a>
          )}
        </div>
      </div>

      {provider.googleMapsUri && (
        <a
          href={provider.googleMapsUri}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-[10px] border border-[#E6EBE6] px-3.5 py-2 text-[13px] font-semibold text-[#5a6a60] transition hover:bg-[#F4F7F3]"
        >
          View &amp; rate on Google
        </a>
      )}
    </div>
  );
}
