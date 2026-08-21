export async function publishProofSocial(input: {
  startupName: string;
  proofUrl: string;
  ringId: string;
  videoUrl?: string | null;
  liveStreamUrl?: string | null;
}) {
  const url = process.env.ZAPIER_SOCIAL_WEBHOOK_URL || process.env.SOCIAL_PUBLISH_WEBHOOK_URL;
  if (!url) return { published: false };

  const primaryAssetUrl = input.videoUrl || input.proofUrl;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.SOCIAL_PUBLISH_WEBHOOK_SECRET
        ? { Authorization: `Bearer ${process.env.SOCIAL_PUBLISH_WEBHOOK_SECRET}` }
        : {}),
    },
    body: JSON.stringify({
      source: "the-anti-balcony",
      event: "proof-ready-social",
      ...input,
      primaryAssetUrl,
      // Emitted only after an authenticated fulfillment callback marks proof ready.
      caption: `We took over Times Square to launch ${input.startupName}. @TheAntiBalcony made the moment happen. #TimesSquareTakeover #StartupLaunch`,
    }),
  });

  if (!response.ok) throw new Error(`Social publishing bridge returned ${response.status}.`);
  return { published: true };
}
