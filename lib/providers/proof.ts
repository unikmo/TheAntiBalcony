export async function requestProofCapture(input: { ringId: string; providerRef?: string | null; startupName: string }) {
  const url = process.env.PROOF_CAPTURE_WEBHOOK_URL;
  if (!url) return { requested: false };
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.PROOF_CAPTURE_WEBHOOK_SECRET
        ? { Authorization: `Bearer ${process.env.PROOF_CAPTURE_WEBHOOK_SECRET}` }
        : {}),
    },
    body: JSON.stringify({ source: "the-anti-balcony", ...input }),
  });
  if (!response.ok) throw new Error(`Proof capture bridge returned ${response.status}.`);
  return { requested: true };
}
