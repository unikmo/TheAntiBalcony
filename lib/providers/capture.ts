export type CaptureRequest = {
  orderId: string;
  orderRef: string;
  startupName: string;
  providerCampaignId: string | null;
  proofOfPlayRef: string;
  playedAt: string;
  scheduledWindowStart: string | null;
  scheduledWindowEnd: string | null;
};

export async function requestLicensedCapture(input: CaptureRequest) {
  const url = process.env.LICENSED_CAPTURE_WEBHOOK_URL
    || process.env.EARTHCAM_CAPTURE_WEBHOOK_URL
    || process.env.PROOF_CAPTURE_WEBHOOK_URL;
  if (!url) return { mode: "manual" as const, requested: false };

  const provider = process.env.CAPTURE_PROVIDER || (process.env.EARTHCAM_CAPTURE_WEBHOOK_URL ? "earthcam-licensed" : "licensed-camera");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": `capture-${input.orderId}-${input.playedAt}`,
      ...(process.env.LICENSED_CAPTURE_WEBHOOK_SECRET
        ? { Authorization: `Bearer ${process.env.LICENSED_CAPTURE_WEBHOOK_SECRET}` }
        : process.env.PROOF_CAPTURE_WEBHOOK_SECRET
          ? { Authorization: `Bearer ${process.env.PROOF_CAPTURE_WEBHOOK_SECRET}` }
          : {}),
    },
    body: JSON.stringify({
      source: "the-anti-balcony",
      event: "licensed_capture_requested",
      provider,
      board: "NASDAQ Tower",
      location: "Times Square, New York",
      captureWindow: { beforeSeconds: 5, appearanceSeconds: 15, afterSeconds: 5 },
      outputRequirement: "Original licensed MP4 capture with visible NASDAQ Tower and surrounding Times Square context.",
      callbackUrl: `${siteUrl()}/api/providers/capture/callback`,
      ...input,
    }),
  });
  if (!response.ok) throw new Error(`Licensed capture bridge returned ${response.status}.`);
  return { mode: provider, requested: true };
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://antibalcony.com").replace(/\/$/, "");
}
