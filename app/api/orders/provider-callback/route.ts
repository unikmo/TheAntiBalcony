import { NextResponse } from "next/server";
import { updateMomentOrderFromProvider } from "@/lib/orders";

export const runtime = "nodejs";

const ALLOWED = ["scheduled", "played", "capture_processing", "capture_ready", "proof_ready", "failed"] as const;
type AllowedStatus = (typeof ALLOWED)[number];

export async function POST(request: Request) {
  const secret = process.env.PROVIDER_CALLBACK_SECRET || process.env.FULFILLMENT_CALLBACK_SECRET;
  if (!secret) return NextResponse.json({ error: "Provider callback is not configured." }, { status: 503 });

  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      orderId?: string;
      status?: AllowedStatus;
      providerRef?: string | null;
      campaignId?: string | null;
      proofOfPlayRef?: string | null;
      playedAt?: string | null;
      captureJobId?: string | null;
      capturePath?: string | null;
      deliverableVideoPath?: string | null;
      deliverableImagePath?: string | null;
      failureReason?: string | null;
    };

    if (!body.orderId || !body.status || !ALLOWED.includes(body.status)) {
      return NextResponse.json({ error: "Invalid provider callback." }, { status: 400 });
    }

    const result = await updateMomentOrderFromProvider({
      orderId: body.orderId,
      status: body.status,
      providerRef: body.providerRef,
      campaignId: body.campaignId,
      proofOfPlayRef: body.proofOfPlayRef,
      playedAt: body.playedAt,
      captureJobId: body.captureJobId,
      capturePath: body.capturePath,
      deliverableVideoPath: body.deliverableVideoPath,
      deliverableImagePath: body.deliverableImagePath,
      failureReason: body.failureReason,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not process provider callback." }, { status: 400 });
  }
}
