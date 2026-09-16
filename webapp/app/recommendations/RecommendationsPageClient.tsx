"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { UserNavbar } from "../home/UserNavbar";
import { SkeletonCard, SkeletonPills } from "../home/SkeletonCard";
import { ProviderCard } from "./ProviderCard";
import {
  fetchSpecialtySuggestions,
  searchProviders,
  type SearchProvidersParams,
} from "./actions";
import {
  CATEGORY_LABELS,
  PROVIDER_CATEGORIES,
  type Provider,
  type ProviderCategory,
  type SuggestedSpecialty,
} from "./provider-types";

const SELF = "self";

const RADIUS_OPTIONS = [
  { label: "5 km", value: 5_000 },
  { label: "10 km", value: 10_000 },
  { label: "25 km", value: 25_000 },
  { label: "50 km", value: 50_000 },
];

const sansStyle = { fontFamily: "var(--font-hanken, 'Hanken Grotesk', sans-serif)" };
const monoStyle = { fontFamily: "var(--font-ibm-mono, 'IBM Plex Mono', monospace)" };

const cardClass = "rounded-2xl border border-[#E9EEE9] bg-white p-[22px]";
const eyebrowClass = "text-[11px] uppercase tracking-[.12em] text-[#8a988f]";

type LinkedPatient = {
  id: string;
  patient: { id: string; full_name: string | null } | null;
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

type Props = {
  fullName: string | null;
  notifications: Notification[];
  linkedPatients: LinkedPatient[];
  viewerId: string;
  initialSuggestions: SuggestedSpecialty[];
};

type Coords = { lat: number; lng: number };

export function RecommendationsPageClient({
  fullName,
  notifications,
  linkedPatients,
  viewerId,
  initialSuggestions,
}: Props) {
  const [selectedLinkId, setSelectedLinkId] = useState(SELF);
  // Keyed by patient id so switching back to an already-loaded patient is instant
  // and the viewer's own suggestions never need a round trip.
  const [suggestionsByPatient, setSuggestionsByPatient] = useState<
    Record<string, SuggestedSpecialty[]>
  >({ [viewerId]: initialSuggestions });

  const [coords, setCoords] = useState<Coords | null>(null);
  const [locationText, setLocationText] = useState("");
  const [locationNote, setLocationNote] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const [radius, setRadius] = useState(10_000);
  const [activeQuery, setActiveQuery] = useState<{ label: string; query: string; category?: ProviderCategory } | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Keeps a stale in-flight search from overwriting a newer one.
  const searchSeq = useRef(0);
  // Signature of the last search that completed successfully. Every Places call is
  // billable, so re-clicking the same chip with the same location and radius must
  // not fire a second one.
  const lastSearchRef = useRef<string | null>(null);

  const selectedPatientId =
    selectedLinkId === SELF
      ? viewerId
      : (linkedPatients.find((lp) => lp.id === selectedLinkId)?.patient?.id ?? viewerId);

  const suggestions = suggestionsByPatient[selectedPatientId];
  const suggestionsLoading = suggestions === undefined;

  // Infer suggestions for a patient we haven't loaded yet.
  useEffect(() => {
    if (suggestionsByPatient[selectedPatientId] !== undefined) return;
    let cancelled = false;
    fetchSpecialtySuggestions(selectedPatientId).then((res) => {
      if (cancelled) return;
      setSuggestionsByPatient((prev) => ({ ...prev, [selectedPatientId]: res.suggestions }));
    });
    return () => {
      cancelled = true;
    };
  }, [selectedPatientId, suggestionsByPatient]);

  const runSearch = useCallback(
    (target: { label: string; query: string; category?: ProviderCategory }, nextRadius = radius) => {
      // A typed location rides along in the text query — Places text search resolves
      // it natively, so there's no separate geocoding step.
      const trimmedLocation = locationText.trim();
      const params: SearchProvidersParams = {
        q: trimmedLocation ? `${target.query} in ${trimmedLocation}` : target.query,
        radius: nextRadius,
      };
      if (target.category) params.category = target.category;
      if (coords && !trimmedLocation) {
        params.lat = coords.lat;
        params.lng = coords.lng;
      }

      // Identical to the last successful search — show what we already have rather
      // than paying for the same results twice.
      const signature = JSON.stringify(params);
      if (signature === lastSearchRef.current) {
        setActiveQuery(target);
        return;
      }

      const seq = ++searchSeq.current;
      setActiveQuery(target);
      setSearching(true);
      setSearchError(null);
      setHasSearched(true);

      searchProviders(params).then((res) => {
        if (seq !== searchSeq.current) return;
        // Only remember successful searches, so an error is always retryable.
        lastSearchRef.current = res.error ? null : signature;
        setProviders(res.providers);
        setSearchError(res.error ?? null);
        setSearching(false);
      });
    },
    [coords, locationText, radius],
  );

  const useMyLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationNote("Your browser can't share a location. Type a place below instead.");
      return;
    }
    setLocating(true);
    setLocationNote(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationText("");
        setLocationNote("Using your current location.");
        setLocating(false);
      },
      () => {
        setLocating(false);
        setLocationNote("We couldn't get your location. Type a place below instead.");
      },
      { timeout: 10_000 },
    );
  };

  const handleRadiusChange = (next: number) => {
    setRadius(next);
    if (activeQuery) runSearch(activeQuery, next);
  };

  const hasLocation = coords !== null || locationText.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#F4F7F3]" style={sansStyle}>
      <UserNavbar fullName={fullName} notifications={notifications} activePath="/recommendations" />

      <main className="mx-auto max-w-[1200px] px-7 py-8">
        <h1 className="text-[22px] font-semibold text-[#16241D]">Find care nearby</h1>
        <p className="mt-1 text-[14px] text-[#5a6a60]">
          Suggestions are based on what&apos;s in the patient record. Ratings and reviews live on
          Google — we link out so you can read and leave them there.
        </p>

        {/* Patient selector — only meaningful for sponsors with linked patients */}
        {linkedPatients.length > 0 && (
          <div className={`mt-5 ${cardClass}`}>
            <p className={eyebrowClass} style={monoStyle}>
              Recommend for
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedLinkId(SELF)}
                className={
                  selectedLinkId === SELF
                    ? "rounded-full border border-[#1F8A5B] bg-[#EFF6F1] px-3.5 py-2 text-[13px] font-semibold text-[#13643F]"
                    : "rounded-full border border-[#E6EBE6] px-3.5 py-2 text-[13px] font-medium text-[#5a6a60] transition-colors hover:bg-[#F4F7F3]"
                }
              >
                You
              </button>
              {linkedPatients.map((lp) => (
                <button
                  key={lp.id}
                  type="button"
                  onClick={() => setSelectedLinkId(lp.id)}
                  className={
                    selectedLinkId === lp.id
                      ? "rounded-full border border-[#1F8A5B] bg-[#EFF6F1] px-3.5 py-2 text-[13px] font-semibold text-[#13643F]"
                      : "rounded-full border border-[#E6EBE6] px-3.5 py-2 text-[13px] font-medium text-[#5a6a60] transition-colors hover:bg-[#F4F7F3]"
                  }
                >
                  {lp.patient?.full_name ?? "Patient"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Location */}
        <div className={`mt-4 ${cardClass}`}>
          <p className={eyebrowClass} style={monoStyle}>
            Location
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              className="rounded-[10px] bg-[#1F8A5B] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#17764e] disabled:opacity-60"
            >
              {locating ? "Locating…" : "Use my location"}
            </button>
            <span className="text-[13px] text-[#94a298]">or</span>
            <input
              type="text"
              value={locationText}
              onChange={(e) => {
                setLocationText(e.target.value);
                if (e.target.value.trim()) setLocationNote(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && activeQuery) runSearch(activeQuery);
              }}
              placeholder="Type a town or city"
              className="min-w-[200px] flex-1 rounded-[10px] border border-[#E6EBE6] px-3.5 py-2 text-[14px] text-[#16241D] outline-none transition focus:border-[#1F8A5B]"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-[#5a6a60]">Within</span>
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => handleRadiusChange(r.value)}
                className={
                  radius === r.value
                    ? "rounded-full border border-[#1F8A5B] bg-[#EFF6F1] px-3 py-1.5 text-[12px] font-semibold text-[#13643F]"
                    : "rounded-full border border-[#E6EBE6] px-3 py-1.5 text-[12px] font-medium text-[#5a6a60] transition-colors hover:bg-[#F4F7F3]"
                }
              >
                {r.label}
              </button>
            ))}
          </div>

          {locationNote && <p className="mt-2.5 text-[13px] text-[#94a298]">{locationNote}</p>}
          {!hasLocation && !locationNote && (
            <p className="mt-2.5 text-[13px] text-[#94a298]">
              Share your location or type a place, then pick a provider type below.
            </p>
          )}
        </div>

        {/* Suggested specialties */}
        <div className={`mt-4 ${cardClass}`}>
          <p className={eyebrowClass} style={monoStyle}>
            Suggested from the record
          </p>

          {suggestionsLoading ? (
            <div className="mt-3">
              <SkeletonPills count={4} />
            </div>
          ) : !suggestions || suggestions.length === 0 ? (
            <p className="mt-3 text-[13px] text-[#94a298]">
              No suggestions from this record yet. Browse by type below.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((s) => {
                const isActive = activeQuery?.query === s.query;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => runSearch({ label: s.label, query: s.query })}
                    className={`max-w-[280px] rounded-[14px] border px-3.5 py-2.5 text-left transition-colors ${
                      isActive
                        ? "border-[#1F8A5B] bg-[#EFF6F1]"
                        : "border-[#E6EBE6] hover:bg-[#F4F7F3]"
                    }`}
                  >
                    <span
                      className={`block text-[13px] font-semibold ${
                        isActive ? "text-[#13643F]" : "text-[#16241D]"
                      }`}
                    >
                      {s.label}
                    </span>
                    {s.reasons.length > 0 && (
                      <span className="mt-0.5 block text-[11px] text-[#94a298]">
                        because: {s.reasons.join(" · ")}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Browse all types */}
        <div className={`mt-4 ${cardClass}`}>
          <p className={eyebrowClass} style={monoStyle}>
            Or browse by type
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {PROVIDER_CATEGORIES.filter((c) => c !== "other").map((c) => {
              const isActive = activeQuery?.category === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() =>
                    runSearch({ label: CATEGORY_LABELS[c], query: CATEGORY_LABELS[c].toLowerCase(), category: c })
                  }
                  className={
                    isActive
                      ? "rounded-full border border-[#1F8A5B] bg-[#EFF6F1] px-3.5 py-2 text-[13px] font-semibold text-[#13643F]"
                      : "rounded-full border border-[#E6EBE6] px-3.5 py-2 text-[13px] font-medium text-[#5a6a60] transition-colors hover:bg-[#F4F7F3]"
                  }
                >
                  {CATEGORY_LABELS[c]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results */}
        <div className={`mt-4 ${cardClass}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className={eyebrowClass} style={monoStyle}>
              {activeQuery ? activeQuery.label : "Results"}
            </p>
            {providers.length > 0 && (
              <p className="text-[11px] text-[#94a298]">
                Best rated first, weighted by number of reviews
              </p>
            )}
          </div>

          {searching ? (
            <div className="mt-4">
              <SkeletonCard rows={5} />
            </div>
          ) : searchError ? (
            <p className="py-8 text-center text-[13px] text-[#94a298]">{searchError}</p>
          ) : !hasSearched ? (
            <p className="py-8 text-center text-[13px] text-[#94a298]">
              Pick a provider type above to see who&apos;s nearby.
            </p>
          ) : providers.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[#94a298]">
              No providers found. Try a wider radius or a different type.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[#EBF0EB]">
              {providers.map((p) => (
                <li key={p.placeId} className="py-3.5 first:pt-1">
                  <ProviderCard provider={p} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-4 text-center text-[12px] text-[#94a298]">
          Provider information and ratings come from Google and are shown live.{" "}
          <Link href="/appointments" className="font-semibold text-[#1F8A5B] hover:underline">
            Book with your care team
          </Link>{" "}
          for in-network visits.
        </p>
      </main>
    </div>
  );
}
