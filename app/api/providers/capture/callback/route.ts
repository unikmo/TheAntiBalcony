import { NextResponse } from "next/server";
import { completeLicensedCapture } from "@/lib/orders";
import { authorizedByEnvironmentSecret } from "@/lib/tokens";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!authorizedByEnvironmentSecret(request, "LICENSED_CAPTURE_CALLBACK_SECRET") && !authorizedByEnvironmentSecret(request, "FULFILLMENT_CALLBACK_SECRET")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const body = await request.json() as {
      orderId?: string;
      provider?: string;
      captureJobId?: string;
      sourceUrl?: string;
      capturePath?: string;
      idempotencyKey?: string;
    };
    if (!body.orderId || !body.provider) return NextResponse.json({ error: "orderId and provider are required." }, { status: 400 });
    const result = await completeLicensedCapture({
      orderId: body.orderId,
      provider: body.provider,
      captureJobId: body.captureJobId,
      sourceUrl: body.sourceUrl,
      capturePath: body.capturePath,
      idempotencyKey: body.idempotencyKey,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Capture callback failed." }, { status: 400 });
  }
}
