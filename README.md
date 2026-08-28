# The Anti-Balcony

**Launch your startup in public.** The Anti-Balcony is a public startup-launch platform built around a shareable launch ritual called a **Ring**.

Core rule: **a launch moment, not a launch competition.** Paid media or physical experiences are never presented as live until the relevant provider/operations workflow has actually confirmed them.

## Commercial ladder

| Tier | Price | Deliverables |
| --- | ---: | --- |
| **Digital Bell** | **$0** | Public Ring + timestamp + shareable launch artifact |
| **The Proof** | **$399** | Provider-confirmed Times Square placement proof |
| **The Clip** | **$799** | Proof + reusable short launch video |
| **The Moment** | **$2,999** | Coordinated Times Square physical launch experience |
| **The Legend** | **$9,999** | Premium physical production + enhanced video/PR workflow |

The product changes materially at $2,999: lower paid tiers sell verified media proof; premium tiers sell a coordinated physical launch moment involving media, people and production.

## Stack

- Next.js 16 / React 19
- Node 22+
- Supabase / PostgreSQL
- Signed/resumable private Supabase Storage uploads
- Blindspot operations adapter with a manual-dashboard fallback
- Licensed capture callback, optional Shotstack packaging and Resend delivery
- Stripe Checkout code remains dormant until payment work resumes
- Zapier for notification bridges, not business-state ownership
- Optional Resend founder emails
- Vercel deployment

## Supabase data model

The application uses server-managed Supabase access. The core tables are:

- `anti_balcony_rings`
- `anti_balcony_fulfillment_events`
- `anti_balcony_fulfillment_jobs`
- `anti_balcony_orders`
- `anti_balcony_order_events`

The migration lives in:

```text
supabase/migrations/20260824012000_create_anti_balcony_backend.sql
supabase/migrations/20260827011303_anti_balcony_fulfillment_v2.sql
supabase/migrations/20260827020500_anti_balcony_creative_validation.sql
```

Row Level Security is enabled on all three tables and the app does not expose direct anonymous table access. Public Ring data is served through the Next.js application.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

The visual launch ritual still works without database credentials. Without Supabase server credentials, new Rings are returned as non-persisted and package requests are unavailable. The package request does not call Stripe.

## Supabase environment

Recommended server variables:

```text
SUPABASE_URL=
SUPABASE_SECRET_KEY=
```

Legacy service-role JWTs are supported through:

```text
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Never expose the secret/service-role key through a `NEXT_PUBLIC_*` variable. The publishable key is browser-safe and is paired with short-lived signed upload tokens.

## Ring behavior

A Ring can contain:

- startup name
- website
- tagline
- category
- what the startup does
- intended customer
- founder/team
- problem
- founder story
- image URL
- social URL

A Ring is indexable only when the full required profile is present. Incomplete Rings remain `noindex`. Qualified Rings can appear in `/launches`, individual launch pages and the dynamic sitemap.

## Stripe (deferred)

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

The current storefront does not invoke `/api/checkout`. It creates an availability request and leaves payment as `not_requested` until operations has confirmed availability and creative approval. Legacy checkout routes remain isolated for the later Stripe phase.

Stripe event idempotency is stored in `anti_balcony_fulfillment_events`.

## Fulfillment state model

```text
creative_upload_pending -> availability_check -> creative_review -> payment_pending
-> booked -> scheduled -> played -> capture_processing -> capture_ready
-> packaging -> proof_ready -> delivered
```

The state machine also includes explicit manual fallbacks (`capture_required`, `packaging_required`), revision (`needs_changes`) and terminal (`cancelled`, `failed`) states. Booking is blocked until manual payment or a waiver is recorded. `played` requires proof-of-play and an exact timestamp; `proof_ready` requires a private stored deliverable.

Full runbook: [`docs/TIMES_SQUARE_FULFILLMENT.md`](docs/TIMES_SQUARE_FULFILLMENT.md).

## Zapier architecture

Zapier is deliberately kept outside the business control loop.

### Zap A — Operations notifications

```text
ZAPIER_OPERATIONS_WEBHOOK_URL=
```

Receives events such as:

```text
fulfillment_created
proof_required
```

Recommended Free-plan structure:

```text
Catch Hook -> Email by Zapier
```

### Zap B — Social approval notifications

```text
ZAPIER_SOCIAL_WEBHOOK_URL=
```

Receives proof-ready events only when social publishing has founder consent. Publishing can remain manual until a dedicated social workflow is justified.

Backward-compatible provider env aliases remain supported in `.env.example`, but the two-hook model is the recommended architecture.

## Callback security

Provider/internal operations callbacks must send:

```text
Authorization: Bearer $FULFILLMENT_CALLBACK_SECRET
```

Configure:

```text
FULFILLMENT_CALLBACK_SECRET=
OPS_API_SECRET=
LICENSED_CAPTURE_CALLBACK_SECRET=
```

The callback endpoint validates status transitions and asset URLs before writing to Supabase.

## Physical Takeover operations

A physical package starts in `ops_review`. The workflow should verify, as applicable:

1. media inventory and creative approval
2. exact public-space footprint and location classification
3. current permit/event requirements
4. insurance requirements
5. talent booking and signed releases
6. branded attire/signage and delivery
7. videographer/streaming setup
8. run of show, connectivity, weather and fallback plan

Do not advertise a blanket "no permit required" rule based only on crew size.

Full runbook: [`docs/TAKEOVER_OPERATIONS.md`](docs/TAKEOVER_OPERATIONS.md).

## Proof-source rule

Use only a licensed/authorized camera, DOOH proof feed, media-owner asset source or properly contracted production footage. Do not scrape and commercially redistribute public webcams unless the terms explicitly permit it.

## Email

Optional founder updates use Resend:

```text
RESEND_API_KEY=
RESEND_FROM=The Anti-Balcony <launch@yourdomain.com>
```

If absent, fulfillment continues without email rather than failing the purchase.

## Production checklist

1. Configure Supabase server credentials and the publishable key in Vercel.
2. Configure `OPS_API_SECRET` and the licensed-capture callback secret.
3. Keep the operations notification hook configured for manual Blindspot booking unless a contracted endpoint is available.
4. Configure only commercially licensed capture infrastructure.
5. Add Shotstack and Resend credentials when those accounts and domains are ready.
6. Confirm the current NASDAQ Tower template and operator creative rules for every campaign.
7. Track orders stuck in operational fallback states.
8. Configure Stripe separately when payment work resumes.
