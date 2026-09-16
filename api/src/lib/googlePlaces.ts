/**
 * Google Places (New) client.
 *
 * Licence constraint: results may NOT be cached or stored. Only `place_id` may be
 * retained indefinitely — every name, address, phone and rating must be re-fetched
 * live on each view. Nothing in this module writes to the database, and nothing
 * downstream of it should either.
 */

const apiKey = process.env.GOOGLE_PLACES_API_KEY;

const PLACES_BASE = "https://places.googleapis.com/v1";

export function isGooglePlacesConfigured(): boolean {
  return Boolean(apiKey);
}

export function getGooglePlacesKey(): string {
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY is not set");
  return apiKey;
}

/**
 * Enterprise-tier field mask ($35 / 1,000 calls).
 *
 * `rating` and `userRatingCount` are what promote this from Pro to Enterprise, and
 * they are a hard product requirement (recommendations are ranked by rating).
 *
 * Do NOT add opening hours, reviews, or other atmosphere fields — Places bills at
 * the highest SKU tier among the fields requested, and those would promote every
 * call to the $40 Atmosphere tier.
 */
const SEARCH_FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.types",
  "places.rating",
  "places.userRatingCount",
  "places.businessStatus",
];

/** Same fields, unprefixed — Place Details returns a bare place, not a `places` array. */
const DETAIL_FIELDS = SEARCH_FIELDS.map((f) => f.replace(/^places\./, ""));

export const PROVIDER_CATEGORIES = [
  "hospital",
  "clinic",
  "doctor",
  "dentist",
  "pharmacy",
  "physiotherapist",
  "other",
] as const;
export type ProviderCategory = (typeof PROVIDER_CATEGORIES)[number];

export type Provider = {
  placeId: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  website: string | null;
  googleMapsUri: string | null;
  rating: number | null;
  userRatingCount: number | null;
  categories: ProviderCategory[];
  businessStatus: string | null;
  distanceMeters: number | null;
};

type RawPlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  types?: string[];
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
};

/**
 * Google's `type` taxonomy is broad; we only surface the healthcare slice of it.
 * A place usually carries several types, so this returns every category that matched.
 */
const CATEGORY_BY_GOOGLE_TYPE: Record<string, ProviderCategory> = {
  hospital: "hospital",
  medical_lab: "clinic",
  wellness_center: "clinic",
  doctor: "doctor",
  dental_clinic: "dentist",
  dentist: "dentist",
  drugstore: "pharmacy",
  pharmacy: "pharmacy",
  physiotherapist: "physiotherapist",
  chiropractor: "physiotherapist",
};

export function mapGoogleTypes(types: string[] | undefined): ProviderCategory[] {
  const mapped = new Set<ProviderCategory>();
  for (const t of types ?? []) {
    const category = CATEGORY_BY_GOOGLE_TYPE[t];
    if (category) mapped.add(category);
  }
  return mapped.size > 0 ? [...mapped] : ["other"];
}

/** Great-circle distance in metres, used only when the caller supplied coordinates. */
export function haversineMeters(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

function mapPlace(
  raw: RawPlace,
  origin?: { lat: number; lng: number },
): Provider | null {
  if (!raw.id) return null;
  const lat = raw.location?.latitude ?? null;
  const lng = raw.location?.longitude ?? null;
  return {
    placeId: raw.id,
    name: raw.displayName?.text ?? "Unnamed provider",
    address: raw.formattedAddress ?? null,
    lat,
    lng,
    phone: raw.internationalPhoneNumber ?? null,
    website: raw.websiteUri ?? null,
    googleMapsUri: raw.googleMapsUri ?? null,
    rating: raw.rating ?? null,
    userRatingCount: raw.userRatingCount ?? null,
    categories: mapGoogleTypes(raw.types),
    businessStatus: raw.businessStatus ?? null,
    distanceMeters:
      origin && lat !== null && lng !== null
        ? haversineMeters(origin.lat, origin.lng, lat, lng)
        : null,
  };
}

export type SearchPlacesParams = {
  /**
   * Free-text query, e.g. "pediatrician" or "pediatrician in Kingston".
   *
   * Specialties go here rather than in `includedType`: Places has place types for
   * hospital/pharmacy/doctor/dentist but none for pediatrician, obgyn, cardiologist
   * and friends. Text search also resolves a typed location natively, which is how
   * manual location entry works without a separate Geocoding call (and second SKU).
   */
  textQuery: string;
  lat?: number;
  lng?: number;
  radiusMeters: number;
};

/**
 * POST /v1/places:searchText. Returns at most one page (~20 results) — we rank
 * within that page, we do not paginate the whole market.
 */
export async function searchPlaces(
  params: SearchPlacesParams,
): Promise<{ providers: Provider[] } | { error: string }> {
  const key = getGooglePlacesKey();
  const hasOrigin = params.lat !== undefined && params.lng !== undefined;

  const body: Record<string, unknown> = { textQuery: params.textQuery };
  if (hasOrigin) {
    body.locationBias = {
      circle: {
        center: { latitude: params.lat, longitude: params.lng },
        radius: params.radiusMeters,
      },
    };
  }

  try {
    const res = await fetch(`${PLACES_BASE}/places:searchText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": SEARCH_FIELDS.join(","),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("searchPlaces failed:", res.status, text);
      return { error: `Places search failed (${res.status}).` };
    }

    const data = (await res.json()) as { places?: RawPlace[] };
    const origin = hasOrigin
      ? { lat: params.lat as number, lng: params.lng as number }
      : undefined;
    const providers = (data.places ?? [])
      .map((p) => mapPlace(p, origin))
      .filter((p): p is Provider => p !== null);
    return { providers };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Places error";
    console.error("searchPlaces failed:", e);
    return { error: message };
  }
}

/** GET /v1/places/{placeId}. `notFound: true` lets the route answer 404 rather than 500. */
export async function getPlaceDetails(
  placeId: string,
): Promise<{ provider: Provider } | { error: string; notFound?: boolean }> {
  const key = getGooglePlacesKey();

  try {
    const res = await fetch(`${PLACES_BASE}/places/${encodeURIComponent(placeId)}`, {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": DETAIL_FIELDS.join(","),
      },
    });

    if (res.status === 404) return { error: "Provider not found.", notFound: true };
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("getPlaceDetails failed:", res.status, text);
      return { error: `Place details failed (${res.status}).` };
    }

    const raw = (await res.json()) as RawPlace;
    const provider = mapPlace(raw);
    if (!provider) return { error: "Provider not found.", notFound: true };
    return { provider };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Places error";
    console.error("getPlaceDetails failed:", e);
    return { error: message };
  }
}
