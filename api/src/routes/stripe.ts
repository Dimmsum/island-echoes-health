import { Request, Response } from "express";
import Stripe from "stripe";
import { createSupabaseForUser, createClientAdmin } from "../lib/supabase.js";
import { createNotification } from "../lib/notifications.js";
import {
  createSetupCheckoutSession,
  getStripe,
  getWebhookSecret,
  getAppBaseUrl,
  isStripeConfigured,
} from "../lib/stripe.js";
import type { AuthRequest } from "../middleware/auth.js";

/**
 * POST /api/sponsorship/create-payment
 * Body: { patientEmail, carePlanId }
 * Creates a pending consent request and Stripe Checkout Session (setup mode) to collect a reusable payment method.
 */
export async function createSponsorshipPayment(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  if (!isStripeConfigured()) {
    res.status(503).json({ error: "Payments are not configured." });
    return;
  }

  const supabase = createSupabaseForUser(req.accessToken);
  const userId = req.user.id;
  const { patientEmail, carePlanId } = req.body as {
    patientEmail?: string;
    carePlanId?: string;
  };

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
    .select("id, name")
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
    })
    .select("id, sponsor_id")
    .single();

  if (insertError) {
    res
      .status(500)
      .json({ error: "Failed to create request. Please try again." });
    return;
  }

  const admin = createClientAdmin();
  const { data: patientUserId } = await admin.rpc("get_user_id_by_email", {
    e: email,
  });
  if (patientUserId) {
    await admin
      .from("sponsorship_consent_requests")
      .update({ patient_id: patientUserId })
      .eq("id", consentRequest.id);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  const checkoutResult = await createSetupCheckoutSession({
    consentRequestId: consentRequest.id,
    carePlanId,
    sponsorId: consentRequest.sponsor_id,
    sponsorEmail: req.user.email ?? email,
    stripeCustomerId: profile?.stripe_customer_id ?? null,
  });

  if ("error" in checkoutResult) {
    await supabase
      .from("sponsorship_consent_requests")
      .delete()
      .eq("id", consentRequest.id);
    res.status(500).json({ error: checkoutResult.error });
    return;
  }

  res.json({
    checkoutUrl: checkoutResult.url,
    consentRequestId: consentRequest.id,
  });
}

/**
 * POST /api/stripe/webhook
 * Raw body required for signature verification. Stripe sends payment_intent.succeeded etc.
 */
export async function handleStripeWebhook(
  req: Request,
  res: Response,
): Promise<void> {
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
      getWebhookSecret(),
    ) as Stripe.Event;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("Stripe webhook signature verification failed:", message);
    res.status(400).json({ error: "Invalid signature." });
    return;
  }

  const admin = createClientAdmin();
  const { error: webhookEventError } = await admin
    .from("stripe_webhook_events")
    .insert({
      id: event.id,
      type: event.type,
      stripe_created_at: new Date(event.created * 1000).toISOString(),
    });

  if (webhookEventError) {
    const code = (webhookEventError as { code?: string }).code;
    if (code === "23505") {
      // Duplicate delivery from Stripe. Treat as success for idempotency.
      res.status(200).json({ received: true, duplicate: true });
      return;
    }

    console.error("Failed to record webhook event:", event.id, webhookEventError);
    // Return 500 so Stripe retries instead of silently losing the event.
    res.status(500).json({ error: "Failed to process webhook." });
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode !== "setup") {
      res.status(200).json({ received: true });
      return;
    }

    const consentRequestId = session.metadata?.consent_request_id;
    if (!consentRequestId) {
      console.warn(
        "checkout.session.completed missing metadata.consent_request_id",
        session.id,
      );
      res.status(200).json({ received: true });
      return;
    }

    const { data: request } = await admin
      .from("sponsorship_consent_requests")
      .select(
        "id, sponsor_id, patient_id, patient_email, care_plan_id, stripe_payment_method_id",
      )
      .eq("id", consentRequestId)
      .single();

    if (!request) {
      console.warn(
        "Consent request not found for checkout.session.completed:",
        consentRequestId,
      );
      res.status(200).json({ received: true });
      return;
    }

    const setupIntentId =
      typeof session.setup_intent === "string"
        ? session.setup_intent
        : session.setup_intent?.id;
    if (!setupIntentId) {
      console.warn(
        "checkout.session.completed missing setup_intent",
        session.id,
      );
      res.status(200).json({ received: true });
      return;
    }

    const setupIntent = await getStripe().setupIntents.retrieve(setupIntentId);
    const paymentMethodId =
      typeof setupIntent.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent.payment_method?.id;

    if (!paymentMethodId) {
      console.warn("setup_intent has no payment_method", setupIntentId);
      res.status(200).json({ received: true });
      return;
    }

    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : (session.customer?.id ??
          (typeof setupIntent.customer === "string"
            ? setupIntent.customer
            : setupIntent.customer?.id) ??
          null);

    await admin
      .from("sponsorship_consent_requests")
      .update({ stripe_payment_method_id: paymentMethodId })
      .eq("id", consentRequestId);

    if (customerId) {
      await admin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", request.sponsor_id);
    }

    let patientId = request.patient_id;
    if (!patientId && request.patient_email) {
      const { data: lookedUpPatientId } = await admin.rpc(
        "get_user_id_by_email",
        { e: request.patient_email },
      );
      patientId = lookedUpPatientId ?? null;
      if (patientId) {
        await admin
          .from("sponsorship_consent_requests")
          .update({ patient_id: patientId })
          .eq("id", consentRequestId);
      }
    }

    if (patientId && !request.stripe_payment_method_id) {
      const { data: plan } = await admin
        .from("care_plans")
        .select("name")
        .eq("id", request.care_plan_id)
        .single();
      const planName = plan?.name ?? "a care plan";
      const { data: sponsorProfile } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", request.sponsor_id)
        .single();
      const sponsorName = sponsorProfile?.full_name ?? "A sponsor";

      await createNotification(
        patientId,
        "consent_request",
        `${sponsorName} wants to sponsor your care`,
        `${sponsorName} has requested to sponsor the ${planName} plan for you. Accept to allow them to see your health information and appointment schedules.`,
        consentRequestId,
      );
    }
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const consentRequestId = pi.metadata?.consent_request_id;
    if (!consentRequestId) {
      console.warn(
        "payment_intent.succeeded missing metadata.consent_request_id",
        pi.id,
      );
      res.status(200).json({ received: true });
      return;
    }

    const { data: request } = await admin
      .from("sponsorship_consent_requests")
      .select("id, patient_id, sponsor_id, care_plan_id, payment_simulated_at")
      .eq("id", consentRequestId)
      .single();

    if (!request) {
      console.warn("Consent request not found for webhook:", consentRequestId);
      res.status(200).json({ received: true });
      return;
    }

    // Guard against duplicate webhook deliveries re-notifying users.
    if (!request.payment_simulated_at) {
      await admin
        .from("sponsorship_consent_requests")
        .update({ payment_simulated_at: new Date().toISOString() })
        .eq("id", consentRequestId);
    }

    const { data: plan } = await admin
      .from("care_plans")
      .select("name")
      .eq("id", request.care_plan_id)
      .single();
    const planName = plan?.name ?? "a care plan";
    const { data: sponsorProfile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", request.sponsor_id)
      .single();
    const sponsorName = sponsorProfile?.full_name ?? "A sponsor";

    if (request.patient_id && !request.payment_simulated_at) {
      await createNotification(
        request.patient_id,
        "consent_request",
        `${sponsorName} wants to sponsor your care`,
        `${sponsorName} has purchased the ${planName} plan for you. Accept to allow them to see your health information and appointment schedules.`,
        consentRequestId,
      );
    }
  }

  if (
    event.type === "customer.subscription.deleted" ||
    event.type === "customer.subscription.updated"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const terminalStatuses = new Set(["canceled", "unpaid", "incomplete_expired"]);
    const shouldEndAccess =
      event.type === "customer.subscription.deleted" ||
      terminalStatuses.has(subscription.status);

    if (shouldEndAccess) {
      const endedAtIso = subscription.ended_at
        ? new Date(subscription.ended_at * 1000).toISOString()
        : new Date().toISOString();

      const { error: updateError } = await admin
        .from("sponsor_patient_plans")
        .update({ ended_at: endedAtIso })
        .eq("stripe_subscription_id", subscription.id)
        .is("ended_at", null);

      if (updateError) {
        console.error(
          "Failed to sync canceled subscription to sponsor_patient_plans:",
          subscription.id,
          updateError,
        );
      }
    }
  }

  res.status(200).json({ received: true });
}

/**
 * POST /api/stripe/portal
 * Creates a Stripe Customer Portal session so sponsors can manage or cancel their subscriptions.
 */
export async function createCustomerPortalSession(
  req: AuthRequest,
  res: Response,
): Promise<void> {
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

  const stripe = getStripe();
  let stripeCustomerId = profile?.stripe_customer_id ?? null;

  if (!stripeCustomerId) {
    const { data: latestPlan } = await supabase
      .from("sponsor_patient_plans")
      .select("stripe_subscription_id")
      .eq("sponsor_id", userId)
      .not("stripe_subscription_id", "is", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestPlan?.stripe_subscription_id) {
      try {
        const subscription = await stripe.subscriptions.retrieve(
          latestPlan.stripe_subscription_id,
        );
        stripeCustomerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : (subscription.customer?.id ?? null);
      } catch (lookupError) {
        console.error(
          "Failed to derive customer from subscription:",
          lookupError,
        );
      }
    }
  }

  if (!stripeCustomerId) {
    res.status(400).json({
      error:
        "No Stripe billing profile found. Start a sponsorship first so we can create your billing account.",
    });
    return;
  }

  if (!profile?.stripe_customer_id) {
    const admin = createClientAdmin();
    await admin
      .from("profiles")
      .update({ stripe_customer_id: stripeCustomerId })
      .eq("id", userId);
  }

  const returnUrl = `${getAppBaseUrl()}/home/profile`;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });
    res.json({ url: session.url });
  } catch (e) {
    const message =
      e instanceof Error
        ? e.message
        : "Failed to create Stripe portal session.";
    console.error("createCustomerPortalSession failed:", e);
    res.status(500).json({ error: message });
  }
}

/**
 * POST /api/stripe/portal/subscription
 * Body: { planId }
 * Creates a Stripe Customer Portal session deep-linked to cancel a specific sponsorship subscription.
 * Only the sponsor on that sponsorship can open this targeted flow.
 */
export async function createSubscriptionPortalSession(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  if (!isStripeConfigured()) {
    res.status(503).json({ error: "Payments are not configured." });
    return;
  }

  const supabase = createSupabaseForUser(req.accessToken);
  const userId = req.user.id;
  const { planId } = req.body as { planId?: string };

  if (!planId) {
    res.status(400).json({ error: "planId is required." });
    return;
  }

  const { data: plan, error: planError } = await supabase
    .from("sponsor_patient_plans")
    .select("id, sponsor_id, stripe_subscription_id")
    .eq("id", planId)
    .is("ended_at", null)
    .single();

  if (planError || !plan) {
    res.status(404).json({ error: "Sponsorship not found." });
    return;
  }

  if (plan.sponsor_id !== userId) {
    res.status(403).json({
      error: "Only the sponsor can manage billing for this sponsorship.",
    });
    return;
  }

  if (!plan.stripe_subscription_id) {
    res.status(400).json({
      error: "No active Stripe subscription found for this sponsorship.",
    });
    return;
  }

  const stripe = getStripe();
  const returnUrl = `${getAppBaseUrl()}/home`;

  try {
    const subscription = await stripe.subscriptions.retrieve(
      plan.stripe_subscription_id,
    );

    const stripeCustomerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : (subscription.customer?.id ?? null);

    if (!stripeCustomerId) {
      res.status(500).json({
        error: "Could not determine billing customer for this sponsorship.",
      });
      return;
    }

    const admin = createClientAdmin();
    await admin
      .from("profiles")
      .update({ stripe_customer_id: stripeCustomerId })
      .eq("id", userId)
      .is("stripe_customer_id", null);

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
      flow_data: {
        type: "subscription_cancel",
        subscription_cancel: {
          subscription: plan.stripe_subscription_id,
        },
        after_completion: {
          type: "redirect",
          redirect: { return_url: returnUrl },
        },
      },
    });

    res.json({ url: session.url });
  } catch (e) {
    const message =
      e instanceof Error
        ? e.message
        : "Failed to create Stripe portal session.";
    console.error("createSubscriptionPortalSession failed:", e);
    res.status(500).json({ error: message });
  }
}
