# The Anti-Balcony

**Ring the Internet Bell.** The internet-native launch ritual for startups that would rather make noise than ask permission.

This repository is a production-minded implementation of the original Anti-Balcony concept. It keeps the brutalist/cyberpunk cultural idea, but replaces brittle "success theater" with a real fulfillment state machine.

## What is implemented

- Distinctive black / neon-pink / electric-green visual system using VT323 + Inter.
- Giant interactive **RING THE BELL** ritual with synthesized bell audio, haptics and visual burst.
- Founder claim flow with startup name, website and launch signal.
- Public latest-rings feed backed by Supabase when configured.
- Native Web Share / clipboard share flow.
- Stripe Checkout for the paid proof-drop tier.
- Verified Stripe webhook processing with event idempotency.
- Billboard fulfillment bridge with idempotency keys.
- Explicit lifecycle: `rung → scheduled/manual_review → live → proof_ready`.
- Authorized fulfillment callback endpoint.
- Optional proof-capture bridge, social-publishing bridge and founder emails.
- CI for typecheck, lint and production build.
- Supabase schema with RLS enabled and no exposed public table policies.

## Why the backend differs from the old blueprint

The original spec used illustrative Adomni/EarthCam requests and immediately showed “YOUR BILLBOARD IS LIVE.” That is unsafe for a real product: DOOH inventory, creative approval, scheduling and proof are asynchronous, and vendor APIs/contracts change.

This implementation uses **provider bridges** instead. Connect the bridge to Adomni, Broadsign, Zapier, Make, or a dedicated worker after you have the current commercial API contract and credentials. The UI only displays a live state after the provider callback confirms it.

That gives you the brand magic without ever fabricating a Times Square moment.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

The visual ritual works with no services configured. In that mode, claimed rings are session-only and the UI says so. Paid checkout remains disabled until Stripe is configured.

## Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to your environment.
4. Keep the service-role key server-side only.

## Stripe

Create a one-time Stripe Price for the paid placement product and set:

```text
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=
```

Configure the Stripe webhook endpoint as:

```text
https://YOUR_DOMAIN/api/stripe/webhook
```

The checkout session stores `ringId`, `startupName`, `email`, and social-consent state in Stripe metadata. Payment completion starts fulfillment; it does **not** claim the billboard is live.

## Billboard fulfillment contract

Set `BILLBOARD_FULFILLMENT_WEBHOOK_URL` to a vetted worker or automation endpoint.

The app sends a JSON payload similar to:

```json
{
  "source": "the-anti-balcony",
  "eventId": "evt_...",
  "ringId": "uuid",
  "startupName": "Acme",
  "email": "founder@example.com",
  "stripeSessionId": "cs_...",
  "callbackUrl": "https://YOUR_DOMAIN/api/fulfillment/callback"
}
```

The bridge should treat the `Idempotency-Key` header as unique and may return:

```json
{
  "providerRef": "campaign_or_booking_id",
  "scheduledAt": "2026-08-22T19:00:00Z"
}
```

When the media provider changes state, call the callback with:

```json
{
  "ringId": "uuid",
  "providerRef": "campaign_or_booking_id",
  "status": "live"
}
```

or, once proof is available:

```json
{
  "ringId": "uuid",
  "providerRef": "campaign_or_booking_id",
  "status": "proof_ready",
  "proofUrl": "https://authorized-proof-host.example/proof/..."
}
```

Authenticate callback requests with:

```text
Authorization: Bearer $FULFILLMENT_CALLBACK_SECRET
```

## Proof and social bridges

- `PROOF_CAPTURE_WEBHOOK_URL`: use only an authorized/licensed camera or DOOH proof source.
- `SOCIAL_PUBLISH_WEBHOOK_URL`: connect to Zapier/Make or your own X/LinkedIn publishing worker.
- Automatic social posting is gated behind explicit founder consent in the backend metadata. Manual Web Share is always available.

Do **not** scrape or redistribute a public webcam feed unless its terms explicitly permit the intended commercial use.

## Email

Founder updates use the Resend REST API when these are configured:

```text
RESEND_API_KEY=
RESEND_FROM=The Anti-Balcony <launch@yourdomain.com>
```

If they are absent, fulfillment continues without email instead of failing the purchase.

## Deployment

Designed for Vercel / Node 22. Add the environment variables to the deployment project and set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS domain.

Recommended production controls before paid traffic:

1. Add WAF/rate limiting to `/api/rings`, `/api/checkout`, and callbacks.
2. Verify Stripe tax/refund policy and paid-media terms.
3. Finalize the DOOH vendor contract and creative-spec validation.
4. Use a licensed proof source.
5. Add moderation for public startup names/taglines.
6. Add observability/alerts for fulfillment jobs stuck in `scheduled` or `manual_review`.
7. Add a retry/dead-letter worker for provider outages.

## Brand constants

- Pink: `#FF0055`
- Green: `#00FF88`
- Black: `#070707`
- Display: VT323
- Body: Inter
- Voice: anti-elitist, internet-native, terse, never fake.
