import type { ProofTier } from "@/lib/providers/billboard";

export async function requestProofCapture(input: {
  ringId: string;
  providerRef?: string | null;
  startupName: string;
  tier: ProofTier;
}) {
  const url = process.env.ZAPIER_PROOF_WEBHOOK_URL || process.env.PROOF_CAPTURE_WEBHOOK_URL;
  if (!url) return { requested: false };

  const requestedAssets = input.tier === "snapshot"
    ? ["screenshot"]
    : input.tier === "video"
      ? ["screenshot", "video_15s"]
      : input.tier === "takeover"
        ? ["screenshot", "edited_launch_video", "live_stream_link", "behind_the_scenes", "press_kit"]
        : ["screenshot", "professional_launch_film", "live_stream_link", "behind_the_scenes", "press_kit", "pr_distribution_receipt"];

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
      requestedAssets,
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/fulfillment/callback`,
    }),
  });

  if (!response.ok) throw new Error(`Proof capture bridge returned ${response.status}.`);
  return { requested: true };
}
