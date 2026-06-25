import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

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
  if (!secret)
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is not set (required for webhook signature verification)",
    );
  return secret;
}

/** Base URL where users land after Stripe (e.g. web dashboard). */
export function getAppBaseUrl(): string {
  const fromEnv = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return "http://localhost:3000";
}

export type CreateTopupIntentParams = {
  walletId: string;
  patientId: string;
  contributorId: string;
  amountCents: number;
};

export async function createWalletTopupIntent(
  params: CreateTopupIntentParams,
): Promise<{ clientSecret: string; paymentIntentId: string } | { error: string }> {
  const stripe = getStripe();
  try {
    const intent = await stripe.paymentIntents.create({
      amount: params.amountCents,
      currency: "usd",
      payment_method_types: ["card"],
      metadata: {
        type: "wallet_topup",
        wallet_id: params.walletId,
        patient_id: params.patientId,
        contributor_id: params.contributorId,
      },
    });

    if (!intent.client_secret) {
      return { error: "Failed to create payment intent." };
    }

    return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Stripe error";
    console.error("createWalletTopupIntent failed:", e);
    return { error: message };
  }
}

export type CreateTopupCheckoutParams = {
  walletId: string;
  patientId: string;
  contributorId: string;
  amountCents: number;
  successUrl: string;
  cancelUrl: string;
};

export async function createWalletTopupCheckoutSession(
  params: CreateTopupCheckoutParams,
): Promise<{ url: string } | { error: string }> {
  const stripe = getStripe();
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: params.amountCents,
            product_data: { name: "Wallet top-up" },
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        metadata: {
          type: "wallet_topup",
          wallet_id: params.walletId,
          patient_id: params.patientId,
          contributor_id: params.contributorId,
        },
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });

    if (!session.url) return { error: "Stripe did not return a checkout URL." };
    return { url: session.url };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Stripe error";
    console.error("createWalletTopupCheckoutSession failed:", e);
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
