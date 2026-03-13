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
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not set (required for webhook signature verification)");
  return secret;
}
