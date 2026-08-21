# The Anti-Balcony

**Ring the Internet Bell.** An internet-native launch ritual for startups that would rather make noise than ask permission.

The Anti-Balcony starts as a free digital launch ritual and scales into provider-confirmed Times Square proof and coordinated physical launch experiences. The core rule is non-negotiable: **the UI and social automation never claim a placement is live until fulfillment has actually confirmed it.**

## Commercial ladder

| Tier | Price | Deliverables |
| --- | ---: | --- |
| **Digital Bell** | **$0** | Animated Internet Bell + public timestamp + manual social share |
| **Billboard Screenshot** | **$399** | Times Square placement + provider-confirmed screenshot + share-ready social post |
| **Billboard Video** | **$799** | Screenshot tier + reusable 15-second launch video |
| **Times Square Takeover** | **$2,999** | Billboard + 2 on-site brand ambassadors + live link + edited launch video + BTS + press kit |
| **VIP Takeover** | **$9,999** | Takeover + 5 brand ambassadors + professional videographer + up to 60-minute live-production window + premium film + PR-distribution workflow |

The product intentionally changes at **$2,999**: the lower paid tiers sell verified media proof; the premium tiers sell a coordinated physical launch moment involving media, people and production.

## Stack

- Next.js 16 / React 19
- Node 22+
- Firebase Admin + Firestore (`theantibalcony`)
- Stripe Checkout + verified webhooks
- Zapier webhook orchestration for media fulfillment, physical operations, proof and optional social posting
- Optional Resend founder emails
- Vercel-ready deployment

## What is implemented

- Black / neon-pink / electric-green Anti-Balcony visual system using VT323 + Inter.
- Giant interactive Internet Bell with synthesized audio, haptics and burst animation.
- Founder claim flow with startup name, website and launch signal.
- Firestore-backed latest-rings feed with safe no-credentials fallback.
- Native Web Share / clipboard sharing.
- Four Stripe paid tiers: `snapshot`, `video`, `takeover`, `vip`.
- Stripe event idempotency stored in Firestore.
- Provider-neutral billboard fulfillment bridge.
- Digital lifecycle: `rung → scheduled/manual_review → live → proof_ready`.
- Physical lifecycle: `rung → ops_review → scheduled → live → proof_ready`.
- Physical packages cannot become `scheduled` until operations clearance is returned.
- Authenticated provider/Zapier callback endpoint.
- Screenshot, video, live-stream, BTS, press-kit and PR-distribution asset callbacks.
- Permit, insurance and talent-release reference fields for premium operations.
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

The configured project ID is:

```text
FIREBASE_PROJECT_ID=theantibalcony
```

Enable **Cloud Firestore** in the Firebase console, create a server service account, then add:

```text
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

The app creates these collections automatically as data arrives:

- `rings`
- `fulfillmentEvents`
- `fulfillmentJobs`

`firestore.rules` denies all direct client access. The application accesses Firestore through Firebase Admin in server routes.

## Stripe

Create four one-time Prices:

```text
STRIPE_PRICE_SNAPSHOT=   # $399
STRIPE_PRICE_VIDEO=      # $799
STRIPE_PRICE_TAKEOVER=   # $2,999
STRIPE_PRICE_VIP=        # $9,999
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

Stripe metadata carries `ringId`, `startupName`, `email`, `tier`, `allowSocial`, and whether physical operations clearance is required. Payment starts fulfillment; it does **not** mark a billboard live or a physical Takeover scheduled.

## Zapier architecture

Use **Webhooks by Zapier → Catch Hook** for the inbound workflows. Keep Catch Hook URLs private and add them as server environment variables.

### Zap 1 — Media + Takeover intake

```text
ZAPIER_BILLBOARD_WEBHOOK_URL=
```

For `snapshot` and `video`, the payload uses:

```text
event = paid-proof-drop
```

For `takeover` and `vip`:

```text
event = paid-times-square-takeover
requiresOperationsClearance = true
```

The premium payload also includes the required number of brand ambassadors, production level, live-production window, deliverables, release requirement and permit-review flag.

**Do not POST `scheduled` for a physical package immediately after payment.** Complete the operations checklist first, then call the authenticated fulfillment callback.

See [`docs/TAKEOVER_OPERATIONS.md`](docs/TAKEOVER_OPERATIONS.md).

### Zap 2 — Proof production

```text
ZAPIER_PROOF_WEBHOOK_URL=
```

This is triggered only after the placement is confirmed `live`. Requested assets branch by tier:

- `snapshot` → screenshot
- `video` → screenshot + 15-second video
- `takeover` → screenshot + edited launch video + live link + BTS + press kit
- `vip` → screenshot + professional launch film + live link + BTS + press kit + PR distribution receipt

Example premium completion callback:

```json
{
  "ringId": "...",
  "status": "proof_ready",
  "proofUrl": "https://.../proof.jpg",
  "videoUrl": "https://.../launch-film.mp4",
  "liveStreamUrl": "https://.../launch",
  "behindScenesUrl": "https://.../bts",
  "pressKitUrl": "https://.../press-kit",
  "prDistributionUrl": "https://.../distribution-report"
}
```

Only send assets actually produced for that customer's package.

### Zap 3 — Confirmed social post

```text
ZAPIER_SOCIAL_WEBHOOK_URL=
```

This workflow is called only after `proof_ready` **and** only if the founder opted into publishing. It prefers the confirmed video asset when one exists, otherwise the screenshot proof.

## Physical Takeover operations

A physical package starts in:

```text
ops_review
```

The operations workflow should verify, as applicable:

1. media inventory and creative approval
2. exact public-space footprint and location classification
3. current MOME / SAPO / NYC Parks / Times Square Alliance requirements
4. insurance requirements
5. talent booking and signed releases
6. branded attire/signage and delivery
7. videographer/streaming setup
8. run of show, connectivity, weather and fallback plan

Current NYC guidance distinguishes simple handheld/tripod filming from activities that require permits or event approvals. Do **not** advertise a blanket "no permit required" rule based only on crew size. If a MOME film permit is required for Times Square, current MOME instructions request filing 7 business days before the shoot; required permits generally require at least $1M CGL, subject to the production's specifics.

Full runbook: [`docs/TAKEOVER_OPERATIONS.md`](docs/TAKEOVER_OPERATIONS.md).

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

Use only a licensed/authorized camera, DOOH proof feed, media-owner asset source or properly contracted production footage. Do not scrape and commercially redistribute a public webcam unless its terms explicitly permit it.

## Margin discipline

Do not assume the $2,999 package costs only $300-$500 to fulfill. Actual cost can include DOOH inventory, talent, rush printing, courier, filming/streaming vendors, insurance, permits/location fees, transport, editing, PR distribution and contingency. Track job-level costs and clear the vendor stack before locking the event date.

## Email

Optional founder updates use Resend:

```text
RESEND_API_KEY=
RESEND_FROM=The Anti-Balcony <launch@yourdomain.com>
```

If absent, fulfillment continues without email rather than failing the purchase.

## Production checklist

1. Enable Firestore and add Firebase Admin credentials.
2. Create the four Stripe Prices and webhook secret.
3. Build the three Catch Hook Zaps and add their URLs.
4. Set `FULFILLMENT_CALLBACK_SECRET` in both Vercel and Zapier callback actions.
5. Finalize the Times Square DOOH vendor contract and current API/creative specs.
6. Build the physical operations/vendor bench before enabling $2,999/$9,999 checkout publicly.
7. Confirm legal rights to screenshot/video/live/BTS proof assets.
8. Add rate limits and public-name/tagline moderation before meaningful traffic.
9. Add monitoring for jobs stuck in `scheduled`, `manual_review`, or `ops_review`.
10. Track actual gross margin per physical Takeover.

## Brand constants

- Pink: `#FF0055`
- Green: `#00FF88`
- Black: `#070707`
- Display: VT323
- Body: Inter
- Voice: anti-elitist, internet-native, terse, never fake.
