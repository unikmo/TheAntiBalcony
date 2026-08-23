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
- Stripe Checkout + verified webhooks
- Zapier for notification bridges, not business-state ownership
- Optional Resend founder emails
- Vercel deployment

## Supabase data model

The application uses server-managed Supabase access. The core tables are:

- `anti_balcony_rings`
- `anti_balcony_fulfillment_events`
- `anti_balcony_fulfillment_jobs`

The migration lives in:

```text
supabase/migrations/20260824012000_create_anti_balcony_backend.sql
```

Row Level Security is enabled on all three tables and the app does not expose direct anonymous table access. Public Ring data is served through the Next.js application.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

The visual launch ritual still works without database credentials. Without Supabase server credentials, new Rings are returned as non-persisted and paid fulfillment is unavailable.

## Supabase environment

Recommended server variables:

```text
SUPABASE_URL=
SUPABASE_SECRET_KEY=
```

Legacy service-role JWTs are supported through:

```text
SUPABASE_SERVICE_ROLE_KEY=
```

Never expose the secret/service-role key through a `NEXT_PUBLIC_*` variable.

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

Stripe metadata carries the Ring/customer/package context. Payment starts fulfillment; it does **not** automatically mark a placement live or a physical Takeover scheduled.

Stripe event idempotency is stored in `anti_balcony_fulfillment_events`.

## Fulfillment state model

Digital:

```text
manual_review -> scheduled -> live -> proof_ready
```

Physical:

```text
ops_review -> scheduled -> live -> proof_ready
```

Physical packages require operations clearance before they can move from `scheduled` to `live`. `proof_ready` requires a real proof URL. Completed or failed jobs cannot silently restart.

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

1. Configure Supabase server credentials in Vercel.
2. Confirm the Supabase migration is applied.
3. Create the four Stripe Prices and webhook secret.
4. Keep the two Zapier notification hooks configured.
5. Set `FULFILLMENT_CALLBACK_SECRET` in Vercel and any approved callback client.
6. Finalize the Times Square media/vendor contract and current creative specs.
7. Build the physical operations/vendor bench before enabling premium checkout publicly.
8. Confirm legal rights to screenshot/video/live/BTS proof assets.
9. Add rate limits and public-content moderation before meaningful traffic.
10. Track actual gross margin and jobs stuck in operational states.
