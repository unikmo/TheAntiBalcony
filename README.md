# The Anti-Balcony

**Ring the Internet Bell.** An internet-native launch ritual for startups that would rather make noise than ask permission.

The product combines a free public launch ritual with a provider-confirmed Times Square proof product. The core rule is non-negotiable: **the UI and social automation never claim a placement is live until fulfillment has actually confirmed it.**

## Commercial ladder

| Tier | Price | Deliverables |
| --- | ---: | --- |
| **Signal Drop** | **$399** | Times Square placement + static screenshot + share-ready social post |
| **Motion Drop** | **$799** | Signal Drop + 15-second video clip |
| **Live Takeover** | **$1,499** | Motion Drop + live-stream link around the launch moment |

Video is intentionally the middle/default value tier: it gives founders a reusable launch asset for social, press outreach, investor updates and their own website rather than a one-off screenshot.

## Stack

- Next.js 16 / React 19
- Node 22+
- Firebase Admin + Firestore (`theantibalcony`)
- Stripe Checkout + verified webhooks
- Zapier webhook orchestration for media fulfillment, proof and optional social posting
- Optional Resend founder emails
- Vercel-ready deployment

## What is implemented

- Black / neon-pink / electric-green Anti-Balcony visual system using VT323 + Inter.
- Giant interactive Internet Bell with synthesized audio, haptics and burst animation.
- Founder claim flow with startup name, website and launch signal.
- Firestore-backed latest-rings feed with a safe no-credentials demo fallback.
- Native Web Share / clipboard sharing.
- Three Stripe proof tiers: `snapshot`, `video`, `live`.
- Stripe event idempotency stored in Firestore.
- Provider-neutral billboard fulfillment bridge.
- Lifecycle: `rung → scheduled/manual_review → live → proof_ready`.
- Authenticated provider/Zapier callback endpoint.
- Screenshot, video and live-stream asset callbacks.
- Optional post-proof social automation gated by founder consent.
- CI for typecheck, lint and production build.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

The visual ritual works with no service credentials. Without Firebase Admin credentials, claimed rings are session-only and the UI says so. Paid checkout remains disabled until Stripe prices exist.

## Firebase / Firestore

The configured project ID is already:

```text
FIREBASE_PROJECT_ID=theantibalcony
```

Create/enable **Cloud Firestore** in the Firebase console, then create a server service account and add:

```text
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

The app creates these collections automatically as data arrives:

- `rings`
- `fulfillmentEvents`
- `fulfillmentJobs`

`firestore.rules` denies all direct client access. The application accesses Firestore only through Firebase Admin in server routes.

## Stripe

Create three one-time Prices:

```text
STRIPE_PRICE_SNAPSHOT=   # $399
STRIPE_PRICE_VIDEO=      # $799
STRIPE_PRICE_LIVE=       # $1,499
```

Also configure:

```text
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

Webhook endpoint:

```text
https://YOUR_DOMAIN/api/stripe/webhook
```

Stripe metadata carries `ringId`, `startupName`, `email`, `tier`, and `allowSocial`. Payment starts fulfillment; it does **not** mark a billboard live.

## Zapier architecture

Use **Webhooks by Zapier → Catch Hook** for each inbound workflow. Keep the generated Catch Hook URLs private and add them as server environment variables.

### Zap 1 — Paid placement

Environment variable:

```text
ZAPIER_BILLBOARD_WEBHOOK_URL=
```

Trigger payload includes:

```json
{
  "source": "the-anti-balcony",
  "event": "paid-proof-drop",
  "ringId": "...",
  "startupName": "Acme",
  "email": "founder@example.com",
  "stripeSessionId": "cs_...",
  "tier": "video",
  "deliverables": ["provider-confirmed placement", "static screenshot", "15-second video clip", "share-ready social post"],
  "callbackUrl": "https://YOUR_DOMAIN/api/fulfillment/callback"
}
```

Recommended Zap actions:

1. Validate/normalize the startup creative request.
2. Create or queue the DOOH booking with the contracted Times Square provider.
3. Store the provider/campaign reference.
4. POST `scheduled` back to `callbackUrl`.
5. When provider evidence confirms playout, POST `live` back to the callback.

### Zap 2 — Proof production

Environment variable:

```text
ZAPIER_PROOF_WEBHOOK_URL=
```

This is triggered only after the placement is confirmed `live`. `requestedAssets` branches by tier:

- `snapshot` → `screenshot`
- `video` → `screenshot`, `video_15s`
- `live` → `screenshot`, `video_15s`, `live_stream_link`

When assets are available, POST:

```json
{
  "ringId": "...",
  "providerRef": "...",
  "status": "proof_ready",
  "proofUrl": "https://.../screenshot",
  "videoUrl": "https://.../video",
  "liveStreamUrl": "https://.../live"
}
```

Only send the fields included in that customer's tier.

### Zap 3 — Confirmed social post

Environment variable:

```text
ZAPIER_SOCIAL_WEBHOOK_URL=
```

This workflow is called only after `proof_ready` **and** only if the founder opted into publishing. The generated caption is:

> We just lit up Times Square! 🚀 [Startup] x @TheAntiBalcony. #StartupLaunch

The proof URL travels with the payload, so the post can attach/link the evidence rather than making an unsupported claim.

## Callback security

Every Zap/provider callback must send:

```text
Authorization: Bearer $FULFILLMENT_CALLBACK_SECRET
```

Set a long random value in:

```text
FULFILLMENT_CALLBACK_SECRET=
```

## Proof-source rule

Use only a licensed/authorized camera, DOOH proof feed or media-owner asset source. Do not scrape and commercially redistribute a public webcam unless its terms explicitly permit it.

## Email

Optional founder updates use Resend:

```text
RESEND_API_KEY=
RESEND_FROM=The Anti-Balcony <launch@yourdomain.com>
```

If absent, fulfillment continues without email rather than failing the purchase.

## Production checklist

1. Enable Firestore and add Firebase Admin credentials.
2. Create the three Stripe Prices and webhook secret.
3. Build the three Catch Hook Zaps and add their URLs.
4. Set `FULFILLMENT_CALLBACK_SECRET` in both Vercel and Zapier callback actions.
5. Finalize the Times Square DOOH vendor contract and current API/creative specs.
6. Confirm legal rights to screenshot/video/live proof assets.
7. Add rate limits/moderation before meaningful public traffic.
8. Add monitoring for jobs stuck in `scheduled` or `manual_review`.

## Brand constants

- Pink: `#FF0055`
- Green: `#00FF88`
- Black: `#070707`
- Display: VT323
- Body: Inter
- Voice: anti-elitist, internet-native, terse, never fake.
