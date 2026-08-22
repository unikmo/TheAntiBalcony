export type ProofTier = "snapshot" | "video" | "takeover" | "vip";

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

export const PACKAGE_OPERATIONS: Record<ProofTier, {
  deliverables: string[];
  physicalCrew: boolean;
  actorCount: number;
  videographer: "none" | "mobile" | "professional";
  liveStreamMinutes: number;
  permitReviewRequired: boolean;
  releaseFormsRequired: boolean;
  pressKit: boolean;
  prDistributionWorkflow: boolean;
}> = {
  snapshot: {
    deliverables: ["provider-confirmed placement", "static screenshot", "share-ready social post"],
    physicalCrew: false,
    actorCount: 0,
    videographer: "none",
    liveStreamMinutes: 0,
    permitReviewRequired: false,
    releaseFormsRequired: false,
    pressKit: false,
    prDistributionWorkflow: false,
  },
  video: {
    deliverables: ["provider-confirmed placement", "static screenshot", "15-second video clip", "share-ready social post"],
    physicalCrew: false,
    actorCount: 0,
    videographer: "none",
    liveStreamMinutes: 0,
    permitReviewRequired: false,
    releaseFormsRequired: false,
    pressKit: false,
    prDistributionWorkflow: false,
  },
  takeover: {
    deliverables: [
      "provider-confirmed placement",
      "static screenshot",
      "edited launch video",
      "live-stream link",
      "2 on-site brand ambassadors",
      "startup-branded attire or approved hand-held branding",
      "press kit",
      "behind-the-scenes clips",
    ],
    physicalCrew: true,
    actorCount: 2,
    videographer: "mobile",
    liveStreamMinutes: 15,
    permitReviewRequired: true,
    releaseFormsRequired: true,
    pressKit: true,
    prDistributionWorkflow: false,
  },
  vip: {
    deliverables: [
      "provider-confirmed placement",
      "static screenshot",
      "professionally edited launch film",
      "up to 60-minute live-stream production window",
      "5 on-site brand ambassadors",
      "startup-branded attire or approved hand-held branding",
      "professional videographer",
      "press kit",
      "behind-the-scenes clips",
      "PR distribution workflow",
    ],
    physicalCrew: true,
    actorCount: 5,
    videographer: "professional",
    liveStreamMinutes: 60,
    permitReviewRequired: true,
    releaseFormsRequired: true,
    pressKit: true,
    prDistributionWorkflow: true,
  },
};

export async function submitBillboardJob(input: BillboardSubmission): Promise<BillboardSubmissionResult> {
  const url = process.env.ZAPIER_OPERATIONS_WEBHOOK_URL
    || process.env.ZAPIER_BILLBOARD_WEBHOOK_URL
    || process.env.BILLBOARD_FULFILLMENT_WEBHOOK_URL;
  if (!url) return { status: "manual_review" };

  const operations = PACKAGE_OPERATIONS[input.tier];
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
      event: "fulfillment_created",
      fulfillmentType: operations.physicalCrew ? "physical" : "digital",
      ...input,
      deliverables: operations.deliverables,
      operations,
      requiresOperationsClearance: operations.physicalCrew,
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/fulfillment/callback`,
    }),
  });

  if (!response.ok) throw new Error(`Operations notification bridge returned ${response.status}.`);

  const data = (await response.json().catch(() => ({}))) as { providerRef?: string; scheduledAt?: string };
  return { status: "submitted", providerRef: data.providerRef, scheduledAt: data.scheduledAt };
}
