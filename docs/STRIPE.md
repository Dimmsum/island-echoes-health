# Stripe Sponsorship Billing

Stripe is implemented as a setup-then-subscribe flow managed on the API server.

## Current Flow

1. Sponsor starts a request with `POST /api/sponsorship/create-payment`.
2. API creates a pending consent request and returns a Stripe Checkout `checkoutUrl` in setup mode.
3. Sponsor completes Checkout to save a reusable payment method.
4. Stripe sends `checkout.session.completed`; API stores `stripe_payment_method_id` and (if possible) notifies the patient.
5. Patient accepts with `POST /api/sponsorship/accept`.
6. API creates a monthly Stripe Subscription, then inserts an active `sponsor_patient_plans` link.
7. Sponsor manages/cancels billing from Stripe Customer Portal:
   - Generic: `POST /api/stripe/portal`
   - Subscription-specific cancel flow: `POST /api/stripe/portal/subscription`
8. Stripe sends subscription webhooks; API ends local sponsorship access by setting `ended_at` when subscription is terminal (`canceled`, `unpaid`, `incomplete_expired`, or `deleted` event).

## Webhook Safety

- Webhook endpoint uses raw body + signature verification.
- Processed Stripe event IDs are stored in `stripe_webhook_events` for idempotency.
- Duplicate event deliveries are acknowledged and skipped safely.

## Environment Variables

Set in API runtime:

- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- Optional: `ALLOW_LEGACY_SIMULATED_SPONSORSHIP=true` to re-enable legacy simulated endpoint (disabled by default)

If `STRIPE_SECRET_KEY` is missing, Stripe-powered endpoints return 503.

## Local Webhook Testing

- Run Stripe CLI:
  - `stripe listen --forward-to localhost:4001/api/stripe/webhook`
- Set `STRIPE_WEBHOOK_SECRET` to the signing secret shown by Stripe CLI.

## Database Notes

- `sponsor_patient_plans.stripe_subscription_id` stores the Stripe subscription backing a sponsorship link.
- `stripe_webhook_events` stores processed Stripe event IDs (idempotency).
- Active link uniqueness is enforced with a partial unique index (`ended_at is null`), so historical ended links no longer block re-sponsorship later.

## Legacy Endpoint

`POST /api/sponsorship/consent-requests` is legacy simulated behavior and now returns 410 unless explicitly re-enabled with `ALLOW_LEGACY_SIMULATED_SPONSORSHIP=true`.
