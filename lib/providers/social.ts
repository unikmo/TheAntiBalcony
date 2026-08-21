export async function publishProofSocial(input: { startupName: string; proofUrl: string; ringId: string }) {
  const url = process.env.ZAPIER_SOCIAL_WEBHOOK_URL || process.env.SOCIAL_PUBLISH_WEBHOOK_URL;
  if (!url) return { published: false };

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
      // This message is emitted only after the fulfillment callback says proof_ready.
      caption: `We just lit up Times Square! 🚀 ${input.startupName} x @TheAntiBalcony. #StartupLaunch`,
    }),
  });

  if (!response.ok) throw new Error(`Social publishing bridge returned ${response.status}.`);
  return { published: true };
}
