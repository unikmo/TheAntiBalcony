import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { handleFulfillmentCallback } from "@/lib/fulfillment";
import type { CallbackFulfillmentStatus } from "@/lib/fulfillment-state";

export const runtime = "nodejs";

function authorized(request: Request) {
  const expected = process.env.FULFILLMENT_CALLBACK_SECRET;
  if (!expected) return false;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b);
}

function validateUrl(value?: string) {
  if (!value) return;
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Invalid asset URL.");
}

const VALID_STATUSES: CallbackFulfillmentStatus[] = ["ops_review", "scheduled", "live", "proof_ready", "failed"];

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = (await request.json()) as {
      ringId?: string;
      startupName?: string;
      email?: string;
      providerRef?: string;
      status?: CallbackFulfillmentStatus;
      proofUrl?: string;
      videoUrl?: string;
      liveStreamUrl?: string;
      behindScenesUrl?: string;
      pressKitUrl?: string;
      prDistributionUrl?: string;
      permitRef?: string;
      insuranceRef?: string;
      talentReleaseRef?: string;
    };

    if (!body.ringId || !body.status || !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "ringId and a valid status are required." }, { status: 400 });
    }

    validateUrl(body.proofUrl);
    validateUrl(body.videoUrl);
    validateUrl(body.liveStreamUrl);
    validateUrl(body.behindScenesUrl);
    validateUrl(body.pressKitUrl);
    validateUrl(body.prDistributionUrl);

    if (body.status === "proof_ready" && !body.proofUrl) {
      return NextResponse.json({ error: "proof_ready requires a proofUrl." }, { status: 400 });
    }

    if (!getSupabaseAdmin()) {
      return NextResponse.json({ error: "Fulfillment database is unavailable." }, { status: 503 });
    }

    await handleFulfillmentCallback({
      ringId: body.ringId,
      startupName: body.startupName,
      email: body.email,
      providerRef: body.providerRef,
      status: body.status,
      proofUrl: body.proofUrl,
      videoUrl: body.videoUrl,
      liveStreamUrl: body.liveStreamUrl,
      behindScenesUrl: body.behindScenesUrl,
      pressKitUrl: body.pressKitUrl,
      prDistributionUrl: body.prDistributionUrl,
      permitRef: body.permitRef,
      insuranceRef: body.insuranceRef,
      talentReleaseRef: body.talentReleaseRef,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Callback failed." }, { status: 400 });
  }
}
