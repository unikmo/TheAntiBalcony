// Legacy orders are retained for fulfilment, but no new legacy orders may be created.
export async function POST() {
  return Response.json({ error: "These packages are retired. Please use the POP request form.", next: "/launch" }, { status: 410 });
}
