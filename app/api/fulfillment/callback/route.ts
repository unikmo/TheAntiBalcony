import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { handleFulfillmentCallback } from "@/lib/fulfillment";

export const runtime = "nodejs";

function authorized(request: Request) {
  const expected = process.env.FULFILLMENT_CALLBACK_SECRET;
  if (!expected) return false;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const body = (await request.json()) as {
      ringId?: string;
      startupName?: string;
      email?: string;
      providerRef?: string;
      status?: "scheduled" | "live" | "proof_ready" | "failed";
      proofUrl?: string;
    };
    if (!body.ringId || !body.status || !["scheduled", "live", "proof_ready", "failed"].includes(body.status)) {
      return NextResponse.json({ error: "ringId and a valid status are required." }, { status: 400 });
    }
    if (body.proofUrl) {
      const proof = new URL(body.proofUrl);
      if (!['http:', 'https:'].includes(proof.protocol)) throw new Error("Invalid proof URL.");
    }
    await handleFulfillmentCallback({
      ringId: body.ringId,
      startupName: body.startupName,
      email: body.email,
      providerRef: body.providerRef,
      status: body.status,
      proofUrl: body.proofUrl,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Callback failed." }, { status: 400 });
  }
}
