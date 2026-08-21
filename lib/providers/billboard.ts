export type ProofTier = "snapshot" | "video" | "live";

export type BillboardSubmission = {
  eventId: string;
  ringId: string | null;
  startupName: string;
  email: string;
  stripeSessionId: string;
  tier: ProofTier;
};

export type BillboardSubmissionResult = {
  status: "submitted" | "manual_review";
  providerRef?: string;
  scheduledAt?: string;
};

const DELIVERABLES: Record<ProofTier, string[]> = {
  snapshot: ["provider-confirmed placement", "static screenshot", "share-ready social post"],
  video: ["provider-confirmed placement", "static screenshot", "15-second video clip", "share-ready social post"],
  live: ["provider-confirmed placement", "static screenshot", "15-second video clip", "live-stream link", "share-ready social post"],
};

export async function submitBillboardJob(input: BillboardSubmission): Promise<BillboardSubmissionResult> {
  const url = process.env.ZAPIER_BILLBOARD_WEBHOOK_URL || process.env.BILLBOARD_FULFILLMENT_WEBHOOK_URL;
  if (!url) return { status: "manual_review" };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": input.eventId,
      ...(process.env.BILLBOARD_FULFILLMENT_WEBHOOK_SECRET
        ? { Authorization: `Bearer ${process.env.BILLBOARD_FULFILLMENT_WEBHOOK_SECRET}` }
        : {}),
    },
    body: JSON.stringify({
      source: "the-anti-balcony",
      event: "paid-proof-drop",
      ...input,
      deliverables: DELIVERABLES[input.tier],
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/fulfillment/callback`,
    }),
  });

  if (!response.ok) throw new Error(`Billboard fulfillment bridge returned ${response.status}.`);

  // Zapier Catch Hook commonly returns a generic acknowledgement rather than
  // campaign metadata. A later authenticated callback remains the authority
  // for scheduled/live/proof-ready status.
  const data = (await response.json().catch(() => ({}))) as { providerRef?: string; scheduledAt?: string };
  return { status: "submitted", providerRef: data.providerRef, scheduledAt: data.scheduledAt };
}
