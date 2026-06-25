import { Response } from "express";
import { createSupabaseForUser, createClientAdmin } from "../lib/supabase.js";
import {
  createWalletTopupIntent,
  createWalletTopupCheckoutSession,
  getStripe,
  getAppBaseUrl,
  isStripeConfigured,
} from "../lib/stripe.js";
import type { AuthRequest } from "../middleware/auth.js";

/**
 * GET /api/wallet
 * Query: ?patientId (optional — for sponsor or clinician viewing a patient's wallet)
 * Without patientId: returns the authenticated user's own wallet (lazy-creates if missing).
 * With patientId: sponsor must have an active link; clinician can query any patient.
 */
export async function getWallet(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const userId = req.user.id;
  const { patientId } = req.query as { patientId?: string };

  const targetPatientId = patientId ?? userId;
  const admin = createClientAdmin();

  // If querying another patient, verify access.
  if (patientId && patientId !== userId) {
    const supabase = createSupabaseForUser(req.accessToken);

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    const isClinician =
      profile?.role === "clinician" || profile?.role === "admin";

    if (!isClinician) {
      // Sponsor: must have an active link to the patient.
      const { data: link } = await supabase
        .from("sponsor_patient_plans")
        .select("id")
        .eq("sponsor_id", userId)
        .eq("patient_id", patientId)
        .is("ended_at", null)
        .maybeSingle();

      if (!link) {
        res.status(403).json({ error: "You do not have access to this wallet." });
        return;
      }
    }
  }

  // Lazy-create the wallet if it doesn't exist yet.
  const { data: wallet, error } = await admin
    .from("patient_wallets")
    .upsert(
      { patient_id: targetPatientId },
      { onConflict: "patient_id", ignoreDuplicates: true },
    )
    .select("id, patient_id, balance_cents, updated_at")
    .eq("patient_id", targetPatientId)
    .single();

  if (error || !wallet) {
    // upsert with ignoreDuplicates won't return the existing row — fetch it.
    const { data: existing, error: fetchError } = await admin
      .from("patient_wallets")
      .select("id, patient_id, balance_cents, updated_at")
      .eq("patient_id", targetPatientId)
      .single();

    if (fetchError || !existing) {
      res.status(500).json({ error: "Failed to load wallet." });
      return;
    }

    res.json({
      wallet: {
        id: existing.id,
        patientId: existing.patient_id,
        balanceCents: existing.balance_cents,
        updatedAt: existing.updated_at,
      },
    });
    return;
  }

  res.json({
    wallet: {
      id: wallet.id,
      patientId: wallet.patient_id,
      balanceCents: wallet.balance_cents,
      updatedAt: wallet.updated_at,
    },
  });
}

/**
 * POST /api/wallet/topup/intent
 * Body: { patientId, amountCents }
 * Creates a Stripe PaymentIntent for a wallet top-up. The wallet is credited
 * only after Stripe fires payment_intent.succeeded (handled in the webhook).
 * Returns { clientSecret, paymentIntentId } for client-side confirmation.
 */
export async function createTopupIntent(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  if (!isStripeConfigured()) {
    res.status(503).json({ error: "Payments are not configured." });
    return;
  }

  const userId = req.user.id;
  const { patientId, amountCents } = req.body as {
    patientId?: string;
    amountCents?: number;
  };

  if (!patientId) {
    res.status(400).json({ error: "patientId is required." });
    return;
  }
  if (!amountCents || typeof amountCents !== "number" || amountCents < 100) {
    res
      .status(400)
      .json({ error: "amountCents must be a number of at least 100 (USD $1.00)." });
    return;
  }

  const admin = createClientAdmin();

  // Confirm target is a patient account.
  const { data: targetProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", patientId)
    .single();

  if (!targetProfile || targetProfile.role !== "patient") {
    res.status(400).json({ error: "Target user is not a patient." });
    return;
  }

  // Lazy-create wallet if needed, then fetch its ID.
  await admin
    .from("patient_wallets")
    .upsert({ patient_id: patientId }, { onConflict: "patient_id", ignoreDuplicates: true });

  const { data: wallet, error: walletError } = await admin
    .from("patient_wallets")
    .select("id")
    .eq("patient_id", patientId)
    .single();

  if (walletError || !wallet) {
    res.status(500).json({ error: "Failed to load patient wallet." });
    return;
  }

  const result = await createWalletTopupIntent({
    walletId: wallet.id,
    patientId,
    contributorId: userId,
    amountCents,
  });

  if ("error" in result) {
    res.status(500).json({ error: result.error });
    return;
  }

  res.status(201).json({
    clientSecret: result.clientSecret,
    paymentIntentId: result.paymentIntentId,
  });
}

/**
 * POST /api/wallet/topup/confirm
 * Body: { paymentIntentId }
 * Synchronously credits the wallet after client-side payment confirmation.
 * Re-fetches the PaymentIntent from Stripe (never trusts client amounts),
 * verifies it succeeded and belongs to the caller, then credits idempotently.
 * Safe to run alongside the payment_intent.succeeded webhook — credit_wallet_topup
 * is a no-op if the PaymentIntent was already applied.
 */
export async function confirmTopup(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  if (!isStripeConfigured()) {
    res.status(503).json({ error: "Payments are not configured." });
    return;
  }

  const userId = req.user.id;
  const { paymentIntentId } = req.body as { paymentIntentId?: string };

  if (!paymentIntentId) {
    res.status(400).json({ error: "paymentIntentId is required." });
    return;
  }

  const stripe = getStripe();
  let pi;
  try {
    pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch {
    res.status(400).json({ error: "Unable to retrieve payment." });
    return;
  }

  if (pi.metadata?.type !== "wallet_topup") {
    res.status(400).json({ error: "Not a wallet top-up payment." });
    return;
  }

  if (pi.status !== "succeeded") {
    res.status(409).json({ error: "Payment has not completed." });
    return;
  }

  // Only the user who created the intent may confirm it.
  if (pi.metadata.contributor_id !== userId) {
    res.status(403).json({ error: "You cannot confirm this payment." });
    return;
  }

  const walletId = pi.metadata.wallet_id;
  if (!walletId || pi.amount_received <= 0) {
    res.status(400).json({ error: "Invalid payment metadata." });
    return;
  }

  const admin = createClientAdmin();
  const { error: creditError } = await admin.rpc("credit_wallet_topup", {
    p_wallet_id: walletId,
    p_amount: pi.amount_received,
    p_contributor_id: pi.metadata.contributor_id ?? null,
    p_payment_intent_id: pi.id,
  });

  if (creditError) {
    console.error("credit_wallet_topup failed:", pi.id, creditError);
    res.status(500).json({ error: "Failed to credit wallet." });
    return;
  }

  const { data: wallet } = await admin
    .from("patient_wallets")
    .select("balance_cents")
    .eq("id", walletId)
    .single();

  res.json({ credited: true, balanceCents: wallet?.balance_cents ?? null });
}

/**
 * GET /api/wallet/transactions
 * Query: ?patientId (optional — same access rules as GET /api/wallet)
 * Returns up to 50 transactions ordered newest-first.
 */
export async function getWalletTransactions(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const userId = req.user.id;
  const { patientId } = req.query as { patientId?: string };

  const targetPatientId = patientId ?? userId;
  const admin = createClientAdmin();

  // Verify access if querying another patient.
  if (patientId && patientId !== userId) {
    const supabase = createSupabaseForUser(req.accessToken);

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    const isClinician =
      profile?.role === "clinician" || profile?.role === "admin";

    if (!isClinician) {
      const { data: link } = await supabase
        .from("sponsor_patient_plans")
        .select("id")
        .eq("sponsor_id", userId)
        .eq("patient_id", patientId)
        .is("ended_at", null)
        .maybeSingle();

      if (!link) {
        res.status(403).json({ error: "You do not have access to this wallet." });
        return;
      }
    }
  }

  const { data: wallet } = await admin
    .from("patient_wallets")
    .select("id")
    .eq("patient_id", targetPatientId)
    .maybeSingle();

  if (!wallet) {
    res.json({ transactions: [] });
    return;
  }

  const { data: transactions, error } = await admin
    .from("wallet_transactions")
    .select(
      "id, wallet_id, contributor_id, amount_cents, description, stripe_payment_intent_id, created_at",
    )
    .eq("wallet_id", wallet.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    res.status(500).json({ error: "Failed to load transactions." });
    return;
  }

  // Resolve contributor names so the client can show who funded each top-up.
  const contributorIds = [
    ...new Set(
      (transactions ?? [])
        .map((t) => t.contributor_id)
        .filter((id): id is string => !!id),
    ),
  ];

  const nameById = new Map<string, string | null>();
  if (contributorIds.length) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", contributorIds);
    for (const p of profiles ?? []) nameById.set(p.id, p.full_name);
  }

  const enriched = (transactions ?? []).map((t) => ({
    ...t,
    contributor_name: t.contributor_id
      ? (nameById.get(t.contributor_id) ?? null)
      : null,
  }));

  res.json({ transactions: enriched });
}

/**
 * POST /api/wallet/topup/checkout
 * Body: { patientId, amountCents }
 * Creates a Stripe Checkout Session (mode: payment) for a wallet top-up.
 * Returns { url } — the caller opens this in a new tab.
 * The wallet is credited when Stripe fires payment_intent.succeeded (same webhook as PaymentIntent flow).
 */
export async function createTopupCheckoutSession(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  if (!isStripeConfigured()) {
    res.status(503).json({ error: "Payments are not configured." });
    return;
  }

  const userId = req.user.id;
  const { patientId, amountCents } = req.body as {
    patientId?: string;
    amountCents?: number;
  };

  if (!patientId) {
    res.status(400).json({ error: "patientId is required." });
    return;
  }
  if (!amountCents || typeof amountCents !== "number" || amountCents < 100) {
    res.status(400).json({ error: "amountCents must be at least 100 (USD $1.00)." });
    return;
  }

  const admin = createClientAdmin();

  const { data: targetProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", patientId)
    .single();

  if (!targetProfile || targetProfile.role !== "patient") {
    res.status(400).json({ error: "Target user is not a patient." });
    return;
  }

  await admin
    .from("patient_wallets")
    .upsert({ patient_id: patientId }, { onConflict: "patient_id", ignoreDuplicates: true });

  const { data: wallet, error: walletError } = await admin
    .from("patient_wallets")
    .select("id")
    .eq("patient_id", patientId)
    .single();

  if (walletError || !wallet) {
    res.status(500).json({ error: "Failed to load patient wallet." });
    return;
  }

  const base = getAppBaseUrl();
  const result = await createWalletTopupCheckoutSession({
    walletId: wallet.id,
    patientId,
    contributorId: userId,
    amountCents,
    successUrl: `${base}/home?topup=success`,
    cancelUrl: `${base}/home`,
  });

  if ("error" in result) {
    res.status(500).json({ error: result.error });
    return;
  }

  res.status(201).json({ url: result.url });
}
