import { Request, Response } from "express";
import Stripe from "stripe";
import { createSupabaseForUser, createClientAdmin } from "../lib/supabase.js";
import { createNotification } from "../lib/notifications.js";
import { getStripe, getStripePublishableKey, getWebhookSecret, getAppBaseUrl, isStripeConfigured } from "../lib/stripe.js";
import type { AuthRequest } from "../middleware/auth.js";

/**
 * POST /api/sponsorship/create-payment
 * Body: { patientEmail, carePlanId }
 * Creates a pending consent request and a Stripe PaymentIntent; returns clientSecret for the client to confirm payment.
 */
export async function createSponsorshipPayment(req: AuthRequest, res: Response): Promise<void> {
  if (!isStripeConfigured()) {
    res.status(503).json({ error: "Payments are not configured." });
    return;
  }

  const supabase = createSupabaseForUser(req.accessToken);
  const userId = req.user.id;
  const { patientEmail, carePlanId } = req.body as { patientEmail?: string; carePlanId?: string };

  const email = (patientEmail as string)?.trim()?.toLowerCase();
  if (!email) {
    res.status(400).json({ error: "Patient email is required." });
    return;
  }
  if (!carePlanId) {
    res.status(400).json({ error: "Care plan is required." });
    return;
  }

  const { data: plan } = await supabase
    .from("care_plans")
    .select("id, name, price_cents")
    .eq("id", carePlanId)
    .single();
  if (!plan) {
    res.status(400).json({ error: "Invalid plan." });
    return;
  }

  const { data: consentRequest, error: insertError } = await supabase
    .from("sponsorship_consent_requests")
    .insert({
      sponsor_id: userId,
      patient_email: email,
      care_plan_id: carePlanId,
      status: "pending",
      payment_simulated_at: null,
    })
    .select("id")
    .single();

  if (insertError) {
    res.status(500).json({ error: "Failed to create request. Please try again." });
    return;
  }

  const admin = createClientAdmin();
  const { data: patientUserId } = await admin.rpc("get_user_id_by_email", { e: email });
  if (patientUserId) {
    await admin
      .from("sponsorship_consent_requests")
      .update({ patient_id: patientUserId })
      .eq("id", consentRequest.id);
  }

  const stripe = getStripe();
  const paymentIntent = await stripe.paymentIntents.create({
    amount: plan.price_cents,
    currency: "usd",
    automatic_payment_methods: { enabled: true },
    metadata: {
      consent_request_id: consentRequest.id,
      sponsor_id: userId,
      care_plan_id: carePlanId,
    },
  });

  const { error: updateError } = await supabase
    .from("sponsorship_consent_requests")
    .update({ stripe_payment_intent_id: paymentIntent.id })
    .eq("id", consentRequest.id);

  if (updateError) {
    res.status(500).json({ error: "Failed to link payment. Please try again." });
    return;
  }

  res.json({
    clientSecret: paymentIntent.client_secret,
    consentRequestId: consentRequest.id,
    publishableKey: getStripePublishableKey() ?? undefined,
  });
}

/**
 * POST /api/stripe/webhook
 * Raw body required for signature verification. Stripe sends payment_intent.succeeded etc.
 */
export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  if (!isStripeConfigured()) {
    res.status(503).end();
    return;
  }

  const rawBody = req.body;
  if (!rawBody || !Buffer.isBuffer(rawBody)) {
    res.status(400).json({ error: "Webhook body must be raw buffer." });
    return;
  }

  const sig = req.headers["stripe-signature"];
  if (!sig || typeof sig !== "string") {
    res.status(400).json({ error: "Missing stripe-signature." });
    return;
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      rawBody as Buffer,
      sig,
      getWebhookSecret()
    ) as Stripe.Event;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("Stripe webhook signature verification failed:", message);
    res.status(400).json({ error: "Invalid signature." });
    return;
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const consentRequestId = pi.metadata?.consent_request_id;
    if (!consentRequestId) {
      console.warn("payment_intent.succeeded missing metadata.consent_request_id", pi.id);
      res.status(200).json({ received: true });
      return;
    }

    const admin = createClientAdmin();
    const { data: request } = await admin
      .from("sponsorship_consent_requests")
      .select("id, patient_id, sponsor_id, care_plan_id")
      .eq("id", consentRequestId)
      .single();

    if (!request) {
      console.warn("Consent request not found for webhook:", consentRequestId);
      res.status(200).json({ received: true });
      return;
    }

    await admin
      .from("sponsorship_consent_requests")
      .update({ payment_simulated_at: new Date().toISOString() })
      .eq("id", consentRequestId);

    const { data: plan } = await admin.from("care_plans").select("name").eq("id", request.care_plan_id).single();
    const planName = plan?.name ?? "a care plan";
    const { data: sponsorProfile } = await admin.from("profiles").select("full_name").eq("id", request.sponsor_id).single();
    const sponsorName = sponsorProfile?.full_name ?? "A sponsor";

    if (request.patient_id) {
      await createNotification(
        request.patient_id,
        "consent_request",
        `${sponsorName} wants to sponsor your care`,
        `${sponsorName} has purchased the ${planName} plan for you. Accept to allow them to see your health information and appointment schedules.`,
        consentRequestId
      );
    }
  }

  res.status(200).json({ received: true });
}

/**
 * POST /api/stripe/portal
 * Creates a Stripe Customer Portal session so sponsors can manage or cancel their subscriptions.
 */
export async function createCustomerPortalSession(req: AuthRequest, res: Response): Promise<void> {
  if (!isStripeConfigured()) {
    res.status(503).json({ error: "Payments are not configured." });
    return;
  }

  const supabase = createSupabaseForUser(req.accessToken);
  const userId = req.user.id;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (error) {
    res.status(500).json({ error: "Failed to load billing profile." });
    return;
  }
  if (!profile?.stripe_customer_id) {
    res.status(400).json({
      error:
        "No Stripe billing profile found. Start a sponsorship first so we can create your billing account.",
    });
    return;
  }

  const stripe = getStripe();
  const returnUrl = `${getAppBaseUrl()}/home/profile`;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl,
    });
    res.json({ url: session.url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create Stripe portal session.";
    console.error("createCustomerPortalSession failed:", e);
    res.status(500).json({ error: message });
  }
}
