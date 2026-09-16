"use server";

import { createClient } from "@/lib/supabase/server";
import { fetchFromApi } from "@/lib/api";
import type { Provider, SuggestedSpecialty } from "./provider-types";

const NOT_SIGNED_IN = "Not signed in.";
const NOT_CONFIGURED = "Provider search isn't configured yet.";

async function getToken(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export type SuggestionsResult = { suggestions: SuggestedSpecialty[]; error?: string };

/** Specialties inferred from the patient's record. Never throws; empty on failure. */
export async function fetchSpecialtySuggestions(patientId?: string): Promise<SuggestionsResult> {
  const token = await getToken();
  if (!token) return { suggestions: [], error: NOT_SIGNED_IN };

  const query = patientId ? `?patientId=${encodeURIComponent(patientId)}` : "";
  try {
    const res = await fetchFromApi(token, `/api/recommendations/suggestions${query}`, {
      cache: "no-store",
    });
    if (!res.ok) return { suggestions: [], error: "Couldn't load suggestions." };
    const data = await res.json().catch(() => ({}));
    return { suggestions: data.suggestions ?? [] };
  } catch {
    return { suggestions: [], error: "Couldn't load suggestions." };
  }
}

export type SearchProvidersParams = {
  q?: string;
  category?: string;
  lat?: number;
  lng?: number;
  radius?: number;
};

export type SearchResult = { providers: Provider[]; error?: string };

/**
 * Live provider search. `cache: "no-store"` is required, not an optimisation:
 * Google's licence forbids caching or storing provider data.
 */
export async function searchProviders(params: SearchProvidersParams): Promise<SearchResult> {
  const token = await getToken();
  if (!token) return { providers: [], error: NOT_SIGNED_IN };

  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.category) search.set("category", params.category);
  if (params.lat !== undefined && params.lng !== undefined) {
    search.set("lat", String(params.lat));
    search.set("lng", String(params.lng));
  }
  if (params.radius !== undefined) search.set("radius", String(params.radius));

  try {
    const res = await fetchFromApi(token, `/api/recommendations/search?${search.toString()}`, {
      cache: "no-store",
    });
    if (res.status === 503) return { providers: [], error: NOT_CONFIGURED };
    if (res.status === 429) {
      // Spend guard. The API's message already says what the user should do.
      const data = await res.json().catch(() => ({}));
      return { providers: [], error: data?.error ?? "Too many searches. Please try again shortly." };
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { providers: [], error: data?.error ?? "Couldn't search providers." };
    }
    const data = await res.json().catch(() => ({}));
    return { providers: data.providers ?? [] };
  } catch {
    return { providers: [], error: "Couldn't search providers." };
  }
}

export type ProviderResult = { provider: Provider | null; error?: string };

export async function fetchProviderDetail(placeId: string): Promise<ProviderResult> {
  const token = await getToken();
  if (!token) return { provider: null, error: NOT_SIGNED_IN };

  try {
    const res = await fetchFromApi(token, `/api/recommendations/${encodeURIComponent(placeId)}`, {
      cache: "no-store",
    });
    if (res.status === 503) return { provider: null, error: NOT_CONFIGURED };
    if (res.status === 429) {
      const data = await res.json().catch(() => ({}));
      return { provider: null, error: data?.error ?? "Too many requests. Please try again shortly." };
    }
    if (res.status === 404) return { provider: null, error: "We couldn't find that provider." };
    if (!res.ok) return { provider: null, error: "Couldn't load this provider." };
    const data = await res.json().catch(() => ({}));
    return { provider: data.provider ?? null };
  } catch {
    return { provider: null, error: "Couldn't load this provider." };
  }
}
