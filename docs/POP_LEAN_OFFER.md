# The Pop Moment — lean release

## Scope

Customer-facing name: **The Pop Moment by UNIKMO**. Existing AntiBalcony domain, Git repository, legal pages and historical Ring/fulfilment records remain in place. No DNS, Stripe account, vendor contract or production deployment was changed in this work.

| Experience | USD subtotal | Included |
| --- | ---: | --- |
| POP | Free | Self-service capture guide; reviewed public page linking to a supported social video |
| Keep it | $199 | Creative direction; customer-supplied footage curated into a 30–45 second film; one revision; one UNIKMO card |
| Go public — NASDAQ request | $549 | Keep it plus a requested 15-second appearance and licensed capture incorporated into the film |

Paid prices exclude applicable tax and delivery. There is no generic $399 billboard package, staffed production package, shipped bell or other prop. The $12 extra-card rate is a configurable launch proposal, not a supplier cost; confirm it before opening intake. Each extra is the same memory/design, shipped to one address. Fifty total cards add 49 × $12 = $588. Keep it with 50 cards is $787; NASDAQ with 50 cards is $1,137, before tax and delivery.

## Customer flow

- `/launch` accepts the occasion, title, date, POP choice, email and external footage link. Paid requests may supply a link later. Raw footage is not forced to the separate 15-second billboard specification.
- `/api/pop` validates inputs and calculates prices on the server. It accepts JSON only, capped at 12 KB; there is no upload, fetch, mirror or media-storage call. Every submission requires footage permissions and a privacy acknowledgement.
- Free requests require public-page consent and a supported social link. They start unpublished. Social consideration is a separate optional consent, not automatic posting or promised reach.
- Paid requests are private. NASDAQ begins at `capture_pending`; the form does not reserve inventory, charge, trigger a provider, or promise a date. The occasion date is not the booked New York time window.
- `/moments` and `/moments/[id]` select only approved free metadata, never private contact data. The original platform hosts the video. A deleted/private post is not an archive; the page explains this.
- Existing NASDAQ visuals are illustrative creative previews, not recorded proof. The video loads only on click.

## Deliberate release gates

The new intake is **off by default**. `POP_INTAKE_ENABLED=true` must be set only after the new tables are installed and verified. `/api/health` reports `popSchemaReady` from a table query and `popIntake` from that result plus the flag. It separately reports `checkoutEnabled=false` and `timesSquareBooking=request_only`.

`docs/sql/pop-intake.sql` is a staging SQL draft, **not an applied/registered migration**. The Supabase CLI was unavailable and its installation was blocked; no alternative remote write was attempted. Use an authorized staging database, register the SQL with `supabase migration new`, run it and `pop-intake-checks.sql`, then run security advisors before activation. Do not infer live persistence from local HTTP tests.

Database design: two service-role-only tables, RLS enabled, explicit deny policies, revoked client grants, server-derived price constraints, unique submission IDs, private card mappings, and an atomic five-requests-per-email/day trigger. Add platform-level bot/rate protection before public launch; per-email limits and moderation do not stop abuse using many addresses.

The existing legal text is preserved and already marked for qualified review. Review it for the new brand, link submissions, personal celebrations, card delivery, retention, access and cancellation terms before accepting paid orders. Confirm the $12 extra-card rate, shipping coverage, tax handling, actual screen cost and card fulfilment process.

EarthCam/capture licensing is handled separately by the owner. No provider is described as connected. The old Blindspot/capture/Shotstack/Resend adapters are preserved for historical orders but **are not automatically invoked by POP requests**. The lean release uses a manual review/production queue; a 25-second proof wrapper is not a 30–45 second edited celebration film.

## Operations API

All operations require `Authorization: Bearer <OPS_API_SECRET>`. Never put this secret into the browser, a public URL or a QR code. Responses are `no-store`. No public queue endpoint exists.

`GET /api/operations/pop` returns the newest 100 requests for manual review (private contact and source links included). This is an API queue, not a newly built admin dashboard.

`POST /api/operations/pop/[id]` supports:

| Action | Additional fields | Effect |
| --- | --- | --- |
| `publish` | `linkReviewed: true` | Approves an active, consented free moment only |
| `unpublish` | None | Removes it from public display |
| `start_production` | `customerApprovalConfirmed: true`, `paymentHandled: true` | Operator confirms quote/scope and separately handled payment or waiver |
| NASDAQ `start_production` | Above plus `bookingRef`, `captureLicenseRef` | Requires documentary references; does not buy inventory or a licence |
| `complete` | `customerApprovalConfirmed: true`, `keylessAccessVerified: true`, `finalVideoUrl` | Links a customer-approved, stable `unikmo.com` memory page and issues card targets; operator must first test signed-out playback without a login or typed key |
| NASDAQ `complete` | Above plus `captureVerified: true` | Operator attests actual licensed footage shows the full appearance |
| `revoke_card` | `ordinal` | Disables that card without changing the other cards |
| `cancel` | None | Hides any public page and makes all card pages unavailable |

Keep it: `submitted → in_production → ready`. NASDAQ: `capture_pending → in_production → ready`. Any active request may be cancelled. Review attestations are stored in `review_log`; the API does not independently verify the operator’s commercial statements. Legacy booking callbacks remain separate.

On completion, the API returns card tokens and ordinals. Print one QR per target: `https://antibalcony.com/m/<token>`. The printer/UNIKMO fulfilment integration and QR print artwork remain manual. Repeating completion preserves existing tokens; a revoked token stays revoked. All cards reference the same final film page, not duplicate video objects. Keep that external UNIKMO memory URL durable; do not print signed storage URLs.

Card links are random, revocable bearer links, not recipient authentication. Anyone with a link can open it. They are noindex and use no-referrer. Confidential memories require an additional access agreement/system before acceptance. No automatic UNIKMO account provisioning, physical shipping, editing, card printing or customer email is claimed here. The operator sends reviewed public links/delivery notifications through the agreed channel; the confirmation screen claims only a saved request.

## Verification

- `npm run lint`: code checks (two existing legacy `<img>` warnings).
- `npm run typecheck` and `npm run build`: TypeScript and production build.
- `npm run test:contracts`: retained legacy fulfilment/security contracts.
- `npm run test:pop`: pure price/input contracts plus real Next HTTP routes against an isolated PostgREST test double. Checks review privacy, idempotency, retired routes, capture gates, 50 stable card links and revocation. **Does not test PostgreSQL/RLS or an external provider.**
- `npm run test:smoke`: missing-configuration behavior and archived routes.
- `npm run test:e2e`: updated Playwright UI journeys; needs Chromium. Browser/visual verification is a separate release gate, not implied by HTTP tests.

Before production: validate the staging schema/RLS, run browser QA at phone/tablet/desktop widths, confirm the commercial/consent terms, obtain explicit release approval, deploy, then exercise one approved real test request. Do not enable Times Square booking solely because the website deploys.
