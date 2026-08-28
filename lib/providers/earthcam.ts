export async function armEarthCamCapture(input: {
  orderId: string;
  orderRef: string;
  eventDate: string;
  scheduledWindowStart: string;
  scheduledWindowEnd: string;
  providerRef?: string | null;
  providerCampaignId?: string | null;
}) {
  const url = process.env.EARTHCAM_CAPTURE_BRIDGE_URL || process.env.PROOF_CAPTURE_WEBHOOK_URL;
  if (!url) return { armed: false as const };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": `${input.orderId}:earthcam-arm`,
      ...(process.env.EARTHCAM_CAPTURE_BRIDGE_SECRET
        ? { Authorization: `Bearer ${process.env.EARTHCAM_CAPTURE_BRIDGE_SECRET}` }
        : process.env.PROOF_CAPTURE_WEBHOOK_SECRET
          ? { Authorization: `Bearer ${process.env.PROOF_CAPTURE_WEBHOOK_SECRET}` }
          : {}),
    },
    body: JSON.stringify({
      source: "the-anti-balcony",
      event: "capture_window_requested",
      captureProvider: "earthcam",
      captureMode: "licensed_archive_or_partner_api",
      exactPlaybackMinuteKnown: false,
      ...input,
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/orders/provider-callback`,
    }),
  });

  if (!response.ok) throw new Error(`EarthCam capture bridge returned ${response.status}.`);
  const data = (await response.json().catch(() => ({}))) as { captureJobId?: string };
  return { armed: true as const, captureJobId: data.captureJobId || null };
}
