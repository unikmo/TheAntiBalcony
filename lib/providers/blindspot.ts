import { createPrivateDownloadUrl, MEDIA_BUCKETS } from "@/lib/media-storage";

export type BlindspotBookingRequest = {
  orderId: string;
  orderRef: string;
  ringId: string;
  startupName: string;
  email: string;
  tier: string;
  timezone: string;
  requestedWindowStart: string;
  requestedWindowEnd: string;
  alternativeWindowStart: string | null;
  alternativeWindowEnd: string | null;
  creativePath: string;
  creativeContentType: string;
  creativeWidth: number;
  creativeHeight: number;
  creativeDurationSeconds: number | null;
};

export async function dispatchBlindspotBookingRequest(input: BlindspotBookingRequest) {
  const dedicatedUrl = process.env.BLINDSPOT_BOOKING_WEBHOOK_URL;
  const operationsUrl = dedicatedUrl
    || process.env.ZAPIER_OPERATIONS_WEBHOOK_URL
    || process.env.ZAPIER_BILLBOARD_WEBHOOK_URL
    || process.env.BILLBOARD_FULFILLMENT_WEBHOOK_URL;
  if (!operationsUrl) return { mode: "manual" as const, dispatched: false };

  const creativeUrl = await createPrivateDownloadUrl(MEDIA_BUCKETS.creative, input.creativePath, 48 * 60 * 60);
  const response = await fetch(operationsUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": `blindspot-request-${input.orderId}`,
      ...(process.env.BLINDSPOT_BOOKING_WEBHOOK_SECRET
        ? { Authorization: `Bearer ${process.env.BLINDSPOT_BOOKING_WEBHOOK_SECRET}` }
        : {}),
    },
    body: JSON.stringify({
      source: "the-anti-balcony",
      event: "blindspot_booking_requested",
      provider: "blindspot",
      bookingMode: dedicatedUrl ? "contracted_webhook" : "manual_dashboard",
      board: "NASDAQ Tower",
      masterFormat: "9:16",
      providerFormatNote: "Adapt the approved 9:16 master to the current NASDAQ Tower template before submission.",
      callbackUrl: `${siteUrl()}/api/operations/orders/${input.orderId}/transition`,
      creativeUrl,
      ...input,
    }),
  });
  if (!response.ok) throw new Error(`Blindspot operations bridge returned ${response.status}.`);
  return { mode: dedicatedUrl ? "contracted_webhook" as const : "manual" as const, dispatched: true };
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://antibalcony.com").replace(/\/$/, "");
}
