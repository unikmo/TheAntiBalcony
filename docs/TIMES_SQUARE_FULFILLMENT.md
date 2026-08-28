# Times Square fulfilment runbook

This runbook covers the non-Stripe flow. The application owns order state; Blindspot, licensed capture, Shotstack and Resend are replaceable provider adapters.

## Flow

```text
creative_upload_pending -> availability_check -> creative_review -> payment_pending
-> booked -> scheduled -> played -> capture_processing | capture_required
-> capture_ready -> packaging | packaging_required -> proof_ready -> delivered
```

`booked` requires `payment_status=manual_paid` or `payment_status=waived`. Stripe is not called by the request flow.

## Intake and storage

The customer creates a public Ring, selects a package and submits:

- a 9:16 image or a 15-second 9:16 video;
- preferred and alternative one-hour windows;
- a delivery email and browser IANA timezone;
- rights, QR/URL rejection, capture, Terms and Privacy acknowledgements;
- optional social-publication consent.

The browser checks dimensions and video duration before requesting a signed resumable upload. Creative, capture and deliverable buckets are private. Customer access uses a hashed capability token; deliverable links are signed and expire after seven days.

## Blindspot booking

Set `BLINDSPOT_BOOKING_WEBHOOK_URL` only when a contracted integration endpoint exists. Otherwise the application sends the same request to `ZAPIER_OPERATIONS_WEBHOOK_URL` for manual Blindspot dashboard booking.

Operations transitions use:

```http
POST /api/operations/orders/:id/transition
Authorization: Bearer $OPS_API_SECRET
Content-Type: application/json
```

Creative accepted and payment requested:

```json
{
  "status": "payment_pending",
  "providerModerationStatus": "approved",
  "reviewNotes": "NASDAQ Tower template approved",
  "idempotencyKey": "creative-approved-ORDER_REF"
}
```

Booking confirmed after manual payment or an approved waiver:

```json
{
  "status": "booked",
  "paymentStatus": "manual_paid",
  "providerCampaignId": "BLINDSPOT_CAMPAIGN_ID",
  "providerRef": "BLINDSPOT_ORDER_REF",
  "idempotencyKey": "booked-BLINDSPOT_CAMPAIGN_ID"
}
```

Scheduled window confirmed:

```json
{
  "status": "scheduled",
  "scheduledWindowStart": "2026-09-10T23:00:00.000Z",
  "scheduledWindowEnd": "2026-09-11T00:00:00.000Z",
  "idempotencyKey": "scheduled-BLINDSPOT_CAMPAIGN_ID"
}
```

## Proof-of-play and licensed visual capture

Blindspot/media-owner proof-of-play is technical evidence. It is not the customer video. When the exact play timestamp is known:

```json
{
  "status": "played",
  "proofOfPlayRef": "PROOF_OF_PLAY_REF",
  "playedAt": "2026-09-10T23:42:15.000Z",
  "idempotencyKey": "played-PROOF_OF_PLAY_REF"
}
```

This dispatches a 25-second capture request: five seconds before, the 15-second appearance and five seconds after. Configure `LICENSED_CAPTURE_WEBHOOK_URL` (or `EARTHCAM_CAPTURE_WEBHOOK_URL` only under a commercial licence). Without a licensed endpoint the order moves to `capture_required` for a contracted operator.

The capture provider calls:

```http
POST /api/providers/capture/callback
Authorization: Bearer $LICENSED_CAPTURE_CALLBACK_SECRET
```

with either an HTTPS `sourceUrl` or a previously signed private `capturePath`.

Operations can request a signed capture or deliverable upload at:

```http
POST /api/operations/orders/:id/upload
Authorization: Bearer $OPS_API_SECRET
```

## Packaging and delivery

With `SHOTSTACK_API_KEY`, capture completion submits a 25-second, 9:16 HD render with a minimal AntiBalcony wrapper and poster frame. Shotstack calls the capability-token callback; the application independently reads render status and copies temporary provider output into private Supabase storage.

Without Shotstack the order moves to `packaging_required`. Upload the finished file through the operations upload endpoint, then transition it to `proof_ready` with `deliverableVideoPath` and/or `deliverableImagePath`.

With `RESEND_API_KEY` and a verified `RESEND_FROM`, `proof_ready` sends the founder a seven-day private download link and moves to `delivered`. Without email configuration it remains `proof_ready` for manual delivery.

## Security rules

- Never put `SUPABASE_SECRET_KEY`, provider keys or callback secrets in `NEXT_PUBLIC_*` variables.
- Never use public storage buckets for customer media.
- Never accept `file:`, plain HTTP or private-network provider asset URLs.
- Every provider callback must carry a unique idempotency key.
- Never mark an order `played` without a proof-of-play reference and exact timestamp.
- Never record or redistribute EarthCam footage without the required commercial rights.
