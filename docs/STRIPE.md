# Stripe payments (sandbox / live)

Payments are handled **on the API server**. The mobile app (or web app) never sees the Stripe secret key; it only uses the **publishable key** and a **client secret** from the API to confirm payment with Stripe’s SDK.

## Flow

1. **Client** calls `POST /api/sponsorship/create-payment` with `{ patientEmail, carePlanId }` and `Authorization: Bearer <access_token>`.
2. **API** creates a pending consent request, creates a Stripe PaymentIntent (amount from the care plan’s `price_cents`), saves `stripe_payment_intent_id` on the request, and returns:
   - `clientSecret` – use with Stripe SDK to confirm payment
   - `consentRequestId`
   - `publishableKey` (optional; you can also set it from env in the app)
3. **Client** uses the Stripe SDK (mobile or web) to confirm the PaymentIntent with `clientSecret`. Card details go only to Stripe.
4. **Stripe** sends a `payment_intent.succeeded` webhook to your API.
5. **API** (webhook handler) sets `payment_simulated_at` on the consent request and sends the “consent request” notification to the patient (if they have an account).

## API env (server)

Set in the API server environment (e.g. `.env`):

- **`STRIPE_SECRET_KEY`** – Stripe secret key (test key for sandbox: `sk_test_...`).
- **`STRIPE_PUBLISHABLE_KEY`** – Publishable key (test: `pk_test_...`). Returned by the create-payment endpoint; can also be used in the client from env.
- **`STRIPE_WEBHOOK_SECRET`** – Webhook signing secret (from Stripe Dashboard → Developers → Webhooks → “Signing secret”). Required so the API can verify webhook events.

If `STRIPE_SECRET_KEY` is missing, `POST /api/sponsorship/create-payment` returns 503 and payments are disabled.

## Webhook URL

- **Local:** Use [Stripe CLI](https://stripe.com/docs/stripe-cli): `stripe listen --forward-to localhost:4001/api/stripe/webhook` and set `STRIPE_WEBHOOK_SECRET` to the printed signing secret.
- **Production:** In Stripe Dashboard → Developers → Webhooks, add endpoint `https://your-api-host/api/stripe/webhook` and subscribe to `payment_intent.succeeded`. Use that endpoint’s signing secret as `STRIPE_WEBHOOK_SECRET`.

The webhook route is registered with **raw body** for signature verification; do not send the webhook through a proxy that parses or rewrites the body.

## Mobile app (client) integration

1. Install Stripe’s SDK (e.g. [Stripe React Native](https://stripe.com/docs/payments/accept-a-payment?platform=react-native) or the native SDK for your stack).
2. Get a payment session from your API:
   - `POST /api/sponsorship/create-payment` with body `{ patientEmail, carePlanId }` and auth header.
   - Store `clientSecret` and optionally `publishableKey` from the response.
3. Initialize Stripe with the **publishable key** (from response or env). Do **not** put the secret key in the app.
4. Use the SDK to collect payment details and confirm the PaymentIntent with `clientSecret` (e.g. `stripe.confirmPayment(...)` or the equivalent for your SDK).
5. On success, show a message like “Payment submitted; the patient will be notified.” The backend will set the consent request as paid and notify the patient when the webhook is received.

## Database

- Migration `00025_stripe_payment_intent_on_consent.sql` adds `stripe_payment_intent_id` to `sponsorship_consent_requests`.
- When the webhook runs, the API sets `payment_simulated_at` on the same row (paid time). Existing flows that use `payment_simulated_at` continue to work.

## Legacy endpoint

`POST /api/sponsorship/consent-requests` still exists: it creates a consent request and sets `payment_simulated_at` immediately (no real payment). Use it only for testing without Stripe. For real payments, use `POST /api/sponsorship/create-payment` and then confirm with Stripe on the client.
