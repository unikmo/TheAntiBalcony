export type BillboardSubmission = {
  eventId: string;
  ringId: string | null;
  startupName: string;
  email: string;
  stripeSessionId: string;
};

export type BillboardSubmissionResult = {
  status: "submitted" | "manual_review";
  providerRef?: string;
  scheduledAt?: string;
};

export async function submitBillboardJob(input: BillboardSubmission): Promise<BillboardSubmissionResult> {
  const url = process.env.BILLBOARD_FULFILLMENT_WEBHOOK_URL;
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
      ...input,
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/fulfillment/callback`,
    }),
  });

  if (!response.ok) throw new Error(`Billboard fulfillment bridge returned ${response.status}.`);
  const data = (await response.json().catch(() => ({}))) as { providerRef?: string; scheduledAt?: string };
  return { status: "submitted", providerRef: data.providerRef, scheduledAt: data.scheduledAt };
}
