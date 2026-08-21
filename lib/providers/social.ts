export async function publishProofSocial(input: { startupName: string; proofUrl: string; ringId: string }) {
  const url = process.env.SOCIAL_PUBLISH_WEBHOOK_URL;
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
      ...input,
      caption: `${input.startupName} rang The Anti-Balcony — and left proof. #InternetBell`,
    }),
  });
  if (!response.ok) throw new Error(`Social publishing bridge returned ${response.status}.`);
  return { published: true };
}
