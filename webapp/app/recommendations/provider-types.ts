/** Shapes returned by /api/recommendations/*. Mirrors api/src/lib/googlePlaces.ts. */

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

export const CATEGORY_LABELS: Record<ProviderCategory, string> = {
  hospital: "Hospital",
  clinic: "Clinic",
  doctor: "Doctor",
  dentist: "Dentist",
  pharmacy: "Pharmacy",
  physiotherapist: "Physio",
  other: "Other",
};

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

export type SuggestedSpecialty = {
  id: string;
  label: string;
  query: string;
  reasons: string[];
  priority: number;
};

export function formatDistance(meters: number | null): string | null {
  if (meters === null) return null;
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(meters < 10_000 ? 1 : 0)} km`;
}
