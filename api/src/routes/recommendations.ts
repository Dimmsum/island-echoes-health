import { Response } from "express";
import { createSupabaseForUser } from "../lib/supabase.js";
import type { AuthRequest } from "../middleware/auth.js";
import {
  isGooglePlacesConfigured,
  searchPlaces,
  getPlaceDetails,
  PROVIDER_CATEGORIES,
  type Provider,
  type ProviderCategory,
} from "../lib/googlePlaces.js";
import {
  suggestSpecialties,
  type SuggestionInput,
} from "../lib/specialtySuggestions.js";
import { checkPlacesQuota, quotaMessage } from "../lib/rateLimit.js";

const DEFAULT_RADIUS_METERS = 10_000;
const MIN_RADIUS_METERS = 1_000;
const MAX_RADIUS_METERS = 50_000;

const NOT_CONFIGURED = "Provider search is not configured.";

/**
 * Google cannot rank by rating — Places API (New) only offers RELEVANCE or
 * DISTANCE for `rankPreference` — so the ranking is ours, applied to the page of
 * results Google returns. That means we rank *within* a query and radius, not
 * across the whole market.
 *
 * A plain mean would put a 5.0 with 3 reviews above a 4.7 with 900, so this uses a
 * shrunk (Bayesian) mean that pulls low-volume ratings toward a neutral prior:
 *
 *   score = (v / (v + m)) * R + (m / (v + m)) * C
 *
 * Unrated providers score 0 and therefore sort last, but they are never dropped.
 */
const PRIOR_WEIGHT = 20; // m — roughly "worth 20 reviews of doubt"
const PRIOR_MEAN = 4.0; // C — neutral baseline rating

function rankScore(p: Provider): number {
  if (p.rating === null) return 0;
  const v = p.userRatingCount ?? 0;
  return (v / (v + PRIOR_WEIGHT)) * p.rating + (PRIOR_WEIGHT / (v + PRIOR_WEIGHT)) * PRIOR_MEAN;
}

function rankProviders(providers: Provider[]): Provider[] {
  return [...providers].sort(
    (a, b) => rankScore(b) - rankScore(a) || (b.userRatingCount ?? 0) - (a.userRatingCount ?? 0),
  );
}

/**
 * GET /api/recommendations/suggestions?patientId=
 *
 * Infers the specialties a patient likely needs from their own record. `patientId`
 * defaults to the caller, mirroring wallet.ts's `patientId ?? userId`, so one route
 * serves both a patient viewing themself and a sponsor viewing a linked patient.
 *
 * Reads go through the user-context client, so RLS is the authorization: a sponsor
 * asking about a patient they are not linked to simply gets empty arrays back, and
 * therefore only the baseline suggestions — never someone else's clinical data.
 *
 * Does not call Google, so this stays free and the page can always render its
 * suggestion row even when GOOGLE_PLACES_API_KEY is unset.
 */
export async function getSuggestions(req: AuthRequest, res: Response): Promise<void> {
  const { patientId } = req.query as { patientId?: string };
  const targetPatientId = patientId ?? req.user.id;

  const supabase = createSupabaseForUser(req.accessToken);

  const [conditionsRes, medicationsRes, labsRes, profileRes] = await Promise.all([
    supabase.from("patient_conditions").select("label, type").eq("patient_id", targetPatientId),
    supabase.from("medications").select("name, ended_at").eq("patient_id", targetPatientId),
    supabase
      .from("lab_results")
      .select("test_name, value, reference_low, reference_high")
      .eq("patient_id", targetPatientId),
    supabase.from("profiles").select("date_of_birth").eq("id", targetPatientId).maybeSingle(),
  ]);

  const input: SuggestionInput = {
    conditions: (conditionsRes.data ?? []).map((c) => ({
      label: c.label as string,
      type: c.type as "condition" | "allergy",
    })),
    medications: (medicationsRes.data ?? []).map((m) => ({
      name: m.name as string,
      endedAt: (m.ended_at as string | null) ?? null,
    })),
    labs: (labsRes.data ?? []).map((l) => ({
      testName: l.test_name as string,
      value: Number(l.value),
      referenceLow: l.reference_low === null ? null : Number(l.reference_low),
      referenceHigh: l.reference_high === null ? null : Number(l.reference_high),
    })),
    dateOfBirth: (profileRes.data?.date_of_birth as string | null) ?? null,
  };

  res.json({ suggestions: suggestSpecialties(input) });
}

/**
 * GET /api/recommendations/search?q=&category=&lat=&lng=&radius=
 *
 * Live provider search. Nothing is persisted or cached — Google's licence permits
 * retaining only `place_id`, so every view re-fetches.
 *
 * Specialties arrive as free text in `q` rather than as a Places type filter: there
 * is no place type for pediatrician, cardiologist and the like. A typed location can
 * simply be part of `q` ("dentist in Kingston"), which text search resolves natively
 * without a separate geocoding call.
 */
export async function searchProviders(req: AuthRequest, res: Response): Promise<void> {
  if (!isGooglePlacesConfigured()) {
    res.status(503).json({ error: NOT_CONFIGURED });
    return;
  }

  const { q, category, lat, lng, radius } = req.query as {
    q?: string;
    category?: string;
    lat?: string;
    lng?: string;
    radius?: string;
  };

  const queryText = q?.trim();
  if (!queryText && !category) {
    res.status(400).json({ error: "Either q or category is required." });
    return;
  }
  if (category && !PROVIDER_CATEGORIES.includes(category as ProviderCategory)) {
    res.status(400).json({ error: "Invalid category value." });
    return;
  }

  // Coordinates are optional, but only useful as a pair.
  let originLat: number | undefined;
  let originLng: number | undefined;
  if (lat != null || lng != null) {
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    if (
      Number.isNaN(parsedLat) ||
      Number.isNaN(parsedLng) ||
      parsedLat < -90 ||
      parsedLat > 90 ||
      parsedLng < -180 ||
      parsedLng > 180
    ) {
      res.status(400).json({ error: "lat and lng must both be valid coordinates." });
      return;
    }
    originLat = parsedLat;
    originLng = parsedLng;
  }

  const rawRadius = radius != null ? Number(radius) : DEFAULT_RADIUS_METERS;
  const radiusMeters = Number.isNaN(rawRadius)
    ? DEFAULT_RADIUS_METERS
    : Math.min(Math.max(MIN_RADIUS_METERS, Math.floor(rawRadius)), MAX_RADIUS_METERS);

  const textQuery = queryText || (category as string);

  // Billable from here on — every call past this point costs money, so the spend
  // guard sits immediately before it, after all free validation has passed.
  const quota = await checkPlacesQuota(req.user.id);
  if (!quota.allowed) {
    res
      .status(429)
      .set("Retry-After", String(quota.retryAfterSeconds))
      .json({ error: quotaMessage(quota.reason) });
    return;
  }

  const result = await searchPlaces({
    textQuery,
    lat: originLat,
    lng: originLng,
    radiusMeters,
  });

  if ("error" in result) {
    res.status(502).json({ error: "Failed to search providers." });
    return;
  }

  const providers = category
    ? result.providers.filter((p) => p.categories.includes(category as ProviderCategory))
    : result.providers;

  res.json({ providers: rankProviders(providers) });
}

/**
 * GET /api/recommendations/:placeId
 * Live detail lookup for one provider. Nothing is persisted.
 */
export async function getProvider(req: AuthRequest, res: Response): Promise<void> {
  if (!isGooglePlacesConfigured()) {
    res.status(503).json({ error: NOT_CONFIGURED });
    return;
  }

  const placeId = req.params.placeId as string;

  // A detail view is a billable Place Details call, so it counts against the same
  // budget as a search.
  const quota = await checkPlacesQuota(req.user.id);
  if (!quota.allowed) {
    res
      .status(429)
      .set("Retry-After", String(quota.retryAfterSeconds))
      .json({ error: quotaMessage(quota.reason) });
    return;
  }

  const result = await getPlaceDetails(placeId);

  if ("error" in result) {
    res.status(result.notFound ? 404 : 502).json({
      error: result.notFound ? "Provider not found." : "Failed to load provider.",
    });
    return;
  }

  res.json({ provider: result.provider });
}
