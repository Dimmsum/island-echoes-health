import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

const STRIPE_PRODUCT_NAME = "Island Echoes Care";

export function getStripe(): Stripe {
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(secretKey, { apiVersion: "2026-02-25.clover" });
}

export function getStripePublishableKey(): string | undefined {
  return publishableKey;
}

export function isStripeConfigured(): boolean {
  return Boolean(secretKey);
}

export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not set (required for webhook signature verification)");
  return secret;
}

/** Base URL where users land after Stripe (e.g. web dashboard). */
export function getAppBaseUrl(): string {
  const fromEnv = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return "http://localhost:3000";
}

export type CreateSetupSessionParams = {
  consentRequestId: string;
  carePlanId: string;
  sponsorId: string;
  sponsorEmail: string;
  stripeCustomerId: string | null;
  successUrl?: string;
  cancelUrl?: string;
};

export async function createSetupCheckoutSession(
  params: CreateSetupSessionParams,
): Promise<{ url: string } | { error: string }> {
  const stripe = getStripe();
  const baseUrl = getAppBaseUrl();
  const successUrl = params.successUrl ?? `${baseUrl}/home?setup=success`;
  const cancelUrl = params.cancelUrl ?? `${baseUrl}/home`;

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
    let productId = products.data.find((p) => p.name === STRIPE_PRODUCT_NAME)?.id;

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
    });

    if (
      subscription.status === "incomplete" ||
      subscription.status === "incomplete_expired"
    ) {
      return {
        error:
          "Subscription could not be activated. Please try a different payment method.",
      };
    }

    return { subscriptionId: subscription.id };
  } catch (e) {
    const err = e as Stripe.errors.StripeError;
    const message = err?.message ?? (e instanceof Error ? e.message : "Subscription failed.");
    console.error("createSubscription failed:", e);
    return { error: message };
  }
}

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
