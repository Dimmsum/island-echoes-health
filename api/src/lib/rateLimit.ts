import { createClientAdmin } from "./supabase.js";

/**
 * Spend guard for billable third-party calls (currently Google Places only).
 *
 * Google Places (New) bills per search at the Enterprise tier and forbids caching
 * results, so cost scales linearly with usage and cannot be engineered away on the
 * read side. The only lever is calling it less. Three limits, cheapest check first:
 *
 *   1. Burst, per user per minute — in memory. Catches a stuck client or a hammered
 *      button. Needs no durability: a restart clearing it is harmless.
 *   2. Daily, per user — in Postgres. Stops one account from consuming the budget.
 *   3. Daily, global — in Postgres. The actual bill ceiling.
 *
 * The daily counters are durable and shared precisely because they are the budget
 * cap: an in-memory counter resets on every deploy and does not exist across more
 * than one instance, which would make the cap meaningless.
 *
 * This limits our own API. It cannot limit the key if it is used from anywhere
 * else, so it complements — never replaces — per-SKU quota caps and a budget alert
 * set in Google Cloud Console.
 */

const METRIC = "google_places";

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? Math.floor(parsed) : fallback;
}

/**
 * Defaults are deliberately conservative — for a billing guard, denying a request
 * is recoverable and an unexpected invoice is not. At the Enterprise rate of
 * roughly $0.035 per call, the global default caps exposure at about $17.50/day
 * (~$525/month) in the worst case. Tune with env vars; see api/.env.
 */
export const PLACES_GLOBAL_DAILY_LIMIT = envInt("GOOGLE_PLACES_DAILY_LIMIT", 500);
export const PLACES_USER_DAILY_LIMIT = envInt("GOOGLE_PLACES_USER_DAILY_LIMIT", 40);
export const PLACES_USER_BURST_LIMIT = envInt("GOOGLE_PLACES_USER_BURST_PER_MIN", 10);

/** Approximate Enterprise-tier unit cost, used only for operator-facing logging. */
const APPROX_COST_PER_CALL_USD = 0.035;

export type QuotaReason = "burst" | "user_daily" | "global_daily" | "unavailable";

export type QuotaDecision =
  | { allowed: true }
  | { allowed: false; reason: QuotaReason; retryAfterSeconds: number };

// ---------------------------------------------------------------------------
// Burst: in-memory sliding window, per user.
// ---------------------------------------------------------------------------

const BURST_WINDOW_MS = 60_000;
const burstHits = new Map<string, number[]>();

/** Keeps the Map from growing without bound in a long-lived process. */
function pruneBurst(now: number): void {
  if (burstHits.size < 1_000) return;
  for (const [key, hits] of burstHits) {
    const live = hits.filter((t) => now - t < BURST_WINDOW_MS);
    if (live.length === 0) burstHits.delete(key);
    else burstHits.set(key, live);
  }
}

function checkBurst(userId: string): QuotaDecision {
  const now = Date.now();
  pruneBurst(now);

  const hits = (burstHits.get(userId) ?? []).filter((t) => now - t < BURST_WINDOW_MS);
  if (hits.length >= PLACES_USER_BURST_LIMIT) {
    const oldest = hits[0] ?? now;
    const retryAfterSeconds = Math.max(1, Math.ceil((BURST_WINDOW_MS - (now - oldest)) / 1000));
    burstHits.set(userId, hits);
    return { allowed: false, reason: "burst", retryAfterSeconds };
  }

  hits.push(now);
  burstHits.set(userId, hits);
  return { allowed: true };
}

/** Seconds until the next UTC midnight, when the daily counters roll over. */
function secondsUntilUtcMidnight(): number {
  const now = new Date();
  const midnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0,
    0,
    0,
    0,
  );
  return Math.max(1, Math.ceil((midnight - now.getTime()) / 1000));
}

// ---------------------------------------------------------------------------
// Daily: durable counters in Postgres, checked and incremented atomically.
// ---------------------------------------------------------------------------

async function incrementDaily(
  scope: string,
  limit: number,
): Promise<{ allowed: boolean; count: number } | { error: true }> {
  const admin = createClientAdmin();
  const { data, error } = await admin.rpc("increment_api_usage", {
    p_scope: scope,
    p_metric: METRIC,
    p_limit: limit,
  });

  if (error) {
    console.error("increment_api_usage failed:", error);
    return { error: true };
  }

  // The function returns a single-row table.
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { error: true };
  return {
    allowed: Boolean((row as { allowed: boolean }).allowed),
    count: Number((row as { current_count: number }).current_count ?? 0),
  };
}

/**
 * Call once immediately before each billable Google Places request.
 *
 * Fails CLOSED: if the counter cannot be read or written, the call is denied. An
 * outage that let requests through unmetered is exactly the scenario this guard
 * exists to prevent, so unavailability must not become an open tap.
 *
 * Per-user is checked before global so that one account hitting its own ceiling
 * does not consume global budget. When global denies after the per-user increment
 * landed, that user is charged an extra count they did not spend — the error is in
 * the conservative direction, which is the right way to be wrong about money.
 */
export async function checkPlacesQuota(userId: string): Promise<QuotaDecision> {
  const burst = checkBurst(userId);
  if (!burst.allowed) return burst;

  const retryAfterSeconds = secondsUntilUtcMidnight();

  const user = await incrementDaily(`user:${userId}`, PLACES_USER_DAILY_LIMIT);
  // A counter we cannot read is reported as "unavailable", not as a reached limit —
  // telling someone they are out of searches when the meter is broken sends them
  // away for a day over what may be a one-minute outage.
  if ("error" in user) return { allowed: false, reason: "unavailable", retryAfterSeconds: 60 };
  if (!user.allowed) return { allowed: false, reason: "user_daily", retryAfterSeconds };

  const global = await incrementDaily("global", PLACES_GLOBAL_DAILY_LIMIT);
  if ("error" in global) return { allowed: false, reason: "unavailable", retryAfterSeconds: 60 };
  if (!global.allowed) {
    console.error(
      `Google Places GLOBAL daily cap reached (${PLACES_GLOBAL_DAILY_LIMIT} calls, ~$${(
        PLACES_GLOBAL_DAILY_LIMIT * APPROX_COST_PER_CALL_USD
      ).toFixed(2)}). Further searches are blocked until UTC midnight.`,
    );
    return { allowed: false, reason: "global_daily", retryAfterSeconds };
  }

  // Warn on the way up so the cap is never the first anyone hears of it.
  if (global.count === Math.floor(PLACES_GLOBAL_DAILY_LIMIT * 0.8)) {
    console.warn(
      `Google Places usage at 80% of the daily cap (${global.count}/${PLACES_GLOBAL_DAILY_LIMIT}, ~$${(
        global.count * APPROX_COST_PER_CALL_USD
      ).toFixed(2)} today).`,
    );
  }

  return { allowed: true };
}

/**
 * User-facing copy for a denied request. The global cap is deliberately vague — an
 * end user cannot act on "the deployment is out of budget", and saying so invites
 * probing.
 */
export function quotaMessage(reason: QuotaReason): string {
  if (reason === "burst") return "Too many searches in a row. Please wait a moment and try again.";
  if (reason === "user_daily") return "You've reached today's provider search limit. Please try again tomorrow.";
  if (reason === "unavailable") return "Provider search is briefly unavailable. Please try again in a minute.";
  return "Provider search is temporarily unavailable. Please try again tomorrow.";
}
