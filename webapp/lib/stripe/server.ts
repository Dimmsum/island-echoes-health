import Stripe from "stripe";

/**
 * Server-only Stripe helpers for sponsorship payments.
 * Required env: STRIPE_SECRET_KEY (use sk_test_... for sandbox).
 * Optional: NEXT_PUBLIC_APP_URL for redirects (defaults to http://localhost:3000).
 */

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  return new Stripe(key);
}

/**
 * Base URL for redirects (e.g. https://your-domain.com or http://localhost:3000)
 */
function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (url) return url.replace(/\/$/, "");
  return "http://localhost:3000";
}

export type CreateSetupSessionParams = {
  consentRequestId: string;
  carePlanId: string;
  sponsorId: string;
  sponsorEmail: string;
  stripeCustomerId: string | null;
};

/**
 * Create a Stripe Checkout Session in setup mode to collect payment method only (no charge).
 * Caller should redirect the user to session.url.
 */
export async function createSetupCheckoutSession(
  params: CreateSetupSessionParams,
): Promise<{ url: string } | { error: string }> {
  const stripe = getStripe();
  const baseUrl = getBaseUrl();
  const successUrl = `${baseUrl}/home?setup=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/home`;

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "setup",
    payment_method_types: ["card"],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      consent_request_id: params.consentRequestId,
      care_plan_id: params.carePlanId,
      sponsor_id: params.sponsorId,
    },
  };

  if (params.stripeCustomerId) {
    sessionParams.customer = params.stripeCustomerId;
  } else {
    sessionParams.customer_email = params.sponsorEmail;
  }

  try {
    const session = await stripe.checkout.sessions.create(sessionParams);
    if (!session.url) return { error: "Failed to create checkout session." };
    return { url: session.url };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Stripe error";
    console.error("createSetupCheckoutSession failed:", e);
    return { error: message };
  }
}

export type AttachPaymentMethodResult =
  | {
      consentRequestId: string;
      paymentMethodId: string;
      stripeCustomerId?: string;
    }
  | { error: string };

/**
 * After redirect from Checkout (setup mode), retrieve session and attach payment method to consent request.
 * Optionally create/update Stripe Customer and save on profile.
 */
export async function attachPaymentMethodFromSession(
  sessionId: string,
): Promise<AttachPaymentMethodResult> {
  const stripe = getStripe();
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["setup_intent"],
    });
    if (session.mode !== "setup") return { error: "Invalid session mode." };
    const setupIntentId = session.setup_intent as string;
    if (!setupIntentId) return { error: "No setup intent on session." };
    const setupIntent =
      typeof session.setup_intent === "object" && session.setup_intent !== null
        ? (session.setup_intent as Stripe.SetupIntent)
        : await stripe.setupIntents.retrieve(setupIntentId);
    const paymentMethodId =
      typeof setupIntent.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent.payment_method?.id;
    if (!paymentMethodId)
      return { error: "No payment method on setup intent." };
    const consentRequestId = session.metadata?.consent_request_id;
    if (!consentRequestId) return { error: "No consent request in session." };
    const result: AttachPaymentMethodResult = {
      consentRequestId,
      paymentMethodId,
    };
    if (session.customer) {
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer.id;
      result.stripeCustomerId = customerId;
    }
    return result;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Stripe error";
    console.error("attachPaymentMethodFromSession failed:", e);
    return { error: message };
  }
}

export type CreatePaymentIntentParams = {
  amountCents: number;
  paymentMethodId: string;
  customerId: string | null;
  consentRequestId: string;
  sponsorId: string;
  patientId: string;
  carePlanId: string;
};

/**
 * Ensure the payment method is attached to a customer (required by Stripe to reuse a PM).
 * If existingCustomerId is set, returns it. Otherwise creates a customer, attaches the PM, returns the new id.
 */
export async function ensureCustomerForPaymentMethod(
  paymentMethodId: string,
  existingCustomerId: string | null,
): Promise<{ customerId: string; created: boolean } | { error: string }> {
  if (existingCustomerId) {
    return { customerId: existingCustomerId, created: false };
  }
  const stripe = getStripe();
  try {
    const customer = await stripe.customers.create({});
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    });
    return { customerId: customer.id, created: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Stripe error";
    console.error("ensureCustomerForPaymentMethod failed:", e);
    return { error: message };
  }
}

/**
 * Create and confirm a PaymentIntent (charge the saved payment method).
 * Used when patient accepts the consent request.
 */
export async function createAndConfirmPaymentIntent(
  params: CreatePaymentIntentParams,
): Promise<{ paymentIntentId: string } | { error: string }> {
  const stripe = getStripe();
  try {
    const piParams: Stripe.PaymentIntentCreateParams = {
      amount: params.amountCents,
      currency: "usd",
      payment_method: params.paymentMethodId,
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: {
        consent_request_id: params.consentRequestId,
        sponsor_id: params.sponsorId,
        patient_id: params.patientId,
        care_plan_id: params.carePlanId,
      },
    };
    if (params.customerId) piParams.customer = params.customerId;
    const paymentIntent = await stripe.paymentIntents.create(piParams);
    if (
      paymentIntent.status === "succeeded" ||
      paymentIntent.status === "processing"
    ) {
      return { paymentIntentId: paymentIntent.id };
    }
    if (paymentIntent.status === "requires_action") {
      return {
        error:
          "The sponsor's card requires additional authentication. They can try a different card or complete authentication when prompted.",
      };
    }
    const declineCode = paymentIntent.last_payment_error?.code;
    const msg =
      declineCode === "card_declined"
        ? "The sponsor's card was declined. Ask them to try a different card."
        : "Payment failed. Please try again.";
    return { error: msg };
  } catch (e) {
    const err = e as Stripe.errors.StripeError;
    const message =
      err?.message || (e instanceof Error ? e.message : "Payment failed.");
    console.error("createAndConfirmPaymentIntent failed:", e);
    return { error: message };
  }
}

const STRIPE_PRODUCT_NAME = "Island Echoes Care";

/**
 * Get or create a Stripe Price for a care plan (recurring monthly).
 * If existingStripePriceId is set, return it. Otherwise create a Product (if needed) and Price, return the new price id.
 */
export async function getOrCreatePriceForCarePlan(
  carePlanId: string,
  priceCents: number,
  existingStripePriceId: string | null,
): Promise<{ priceId: string; created: boolean } | { error: string }> {
  if (existingStripePriceId) {
    return { priceId: existingStripePriceId, created: false };
  }
  const stripe = getStripe();
  try {
    const products = await stripe.products.list({ active: true, limit: 100 });
    let productId = products.data.find(
      (p) => p.name === STRIPE_PRODUCT_NAME,
    )?.id;
    if (!productId) {
      const product = await stripe.products.create({
        name: STRIPE_PRODUCT_NAME,
        metadata: { app: "island-echoes-health" },
      });
      productId = product.id;
    }

    const prices = await stripe.prices.list({
      product: productId,
      active: true,
      type: "recurring",
    });
    const existing = prices.data.find(
      (p) =>
        p.recurring?.interval === "month" &&
        p.unit_amount === priceCents &&
        p.metadata?.care_plan_id === carePlanId,
    );
    if (existing) return { priceId: existing.id, created: false };

    const price = await stripe.prices.create({
      product: productId,
      unit_amount: priceCents,
      currency: "usd",
      recurring: { interval: "month" },
      metadata: { care_plan_id: carePlanId },
    });
    return { priceId: price.id, created: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Stripe error";
    console.error("getOrCreatePriceForCarePlan failed:", e);
    return { error: message };
  }
}

export type CreateSubscriptionParams = {
  customerId: string;
  paymentMethodId: string;
  priceId: string;
  metadata: {
    consent_request_id: string;
    sponsor_id: string;
    patient_id: string;
    care_plan_id: string;
  };
};

/**
 * Create a monthly Stripe Subscription (charges the default payment method now and each billing cycle).
 */
export async function createSubscription(
  params: CreateSubscriptionParams,
): Promise<{ subscriptionId: string } | { error: string }> {
  const stripe = getStripe();
  try {
    const subscription = await stripe.subscriptions.create({
      customer: params.customerId,
      items: [{ price: params.priceId }],
      default_payment_method: params.paymentMethodId,
      payment_behavior: "error_if_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      metadata: params.metadata,
      expand: ["latest_invoice.payment_intent"],
    });
    if (
      subscription.status === "incomplete" ||
      subscription.status === "incomplete_expired"
    ) {
      const reason =
        subscription.latest_invoice &&
        typeof subscription.latest_invoice === "object"
          ? (subscription.latest_invoice as Stripe.Invoice)
              .last_finalization_error?.message
          : "Payment failed.";
      return {
        error:
          reason ||
          "Subscription could not be activated. Please try a different card.",
      };
    }
    return { subscriptionId: subscription.id };
  } catch (e) {
    const err = e as Stripe.errors.StripeError;
    const message =
      err?.message ?? (e instanceof Error ? e.message : "Subscription failed.");
    console.error("createSubscription failed:", e);
    return { error: message };
  }
}

/**
 * Cancel a Stripe Subscription immediately (stops recurring billing and access).
 */
export async function cancelSubscription(
  subscriptionId: string,
): Promise<{ ok: true } | { error: string }> {
  const stripe = getStripe();
  try {
    await stripe.subscriptions.cancel(subscriptionId);
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Cancel failed.";
    console.error("cancelSubscription failed:", e);
    return { error: message };
  }
}
