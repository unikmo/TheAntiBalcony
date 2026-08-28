// Retired catalog. Existing Stripe webhooks remain for historical transactions.
export async function POST() {
  return Response.json({ error: "These packages are retired. Use the POP request form; no payment is taken there.", next: "/launch" }, { status: 410 });
}
