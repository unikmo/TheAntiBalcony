import type { ProofTier } from "@/lib/providers/billboard";

export async function requestProofCapture(input: {
  ringId: string;
  providerRef?: string | null;
  startupName: string;
  tier: ProofTier;
}) {
  const url = process.env.ZAPIER_PROOF_WEBHOOK_URL || process.env.PROOF_CAPTURE_WEBHOOK_URL;
  if (!url) return { requested: false };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.PROOF_CAPTURE_WEBHOOK_SECRET
        ? { Authorization: `Bearer ${process.env.PROOF_CAPTURE_WEBHOOK_SECRET}` }
        : {}),
    },
    body: JSON.stringify({
      source: "the-anti-balcony",
      event: "capture-proof",
      ...input,
      requestedAssets: input.tier === "snapshot"
        ? ["screenshot"]
        : input.tier === "video"
          ? ["screenshot", "video_15s"]
          : ["screenshot", "video_15s", "live_stream_link"],
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/fulfillment/callback`,
    }),
  });

  if (!response.ok) throw new Error(`Proof capture bridge returned ${response.status}.`);
  return { requested: true };
}
