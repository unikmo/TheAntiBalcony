import { createHash, randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { reviewBlindspotCreative } from "@/lib/providers/blindspot";

export const runtime = "nodejs";

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function POST(request: Request) {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "Creative storage is not configured." }, { status: 503 });

  try {
    const body = (await request.json()) as { orderId?: string; accessToken?: string };
    if (!body.orderId || !body.accessToken) {
      return NextResponse.json({ error: "Booking details are incomplete." }, { status: 400 });
    }

    const { data: order, error: loadError } = await db
      .from("anti_balcony_orders")
      .select("*")
      .eq("id", body.orderId)
      .maybeSingle();

    if (loadError || !order || order.access_token_hash !== sha256(body.accessToken)) {
      return NextResponse.json({ error: "Unauthorized booking token." }, { status: 401 });
    }
    if (!order.creative_path || !order.creative_content_type || !order.creative_width || !order.creative_height) {
      return NextResponse.json({ error: "Creative upload metadata is incomplete." }, { status: 400 });
    }

    // Provider preflight is opportunistic before payment. Local validation already enforces
    // file type, aspect ratio, duration and size. If Blindspot is not yet reachable, the
    // customer may still pay and final provider review happens during paid fulfillment.
    const review = await reviewBlindspotCreative({
      orderId: order.id,
      orderRef: order.order_ref,
      providerRef: order.provider_ref,
      holdRef: order.provider_hold_ref,
      creativePath: order.creative_path,
      contentType: order.creative_content_type,
      width: order.creative_width,
      height: order.creative_height,
      durationSeconds: order.creative_duration_seconds,
    }).catch((error) => ({
      status: "manual_review" as const,
      moderationStatus: null,
      notes: error instanceof Error ? error.message : "Provider preflight will finish after payment.",
    }));

    const checkoutReady = review.status !== "needs_changes";
    const nextStatus = review.status === "needs_changes"
      ? "needs_changes"
      : review.status === "approved"
        ? "creative_review"
        : "manual_review";

    const now = new Date().toISOString();
    const { error: updateError } = await db.from("anti_balcony_orders").update({
      creative_received_at: now,
      provider_moderation_status: review.moderationStatus || review.status,
      creative_review_notes: review.notes || null,
      status: nextStatus,
      updated_at: now,
    }).eq("id", order.id);
    if (updateError) throw new Error(updateError.message);

    await db.from("anti_balcony_order_events").insert({
      id: randomUUID(),
      order_id: order.id,
      event_type: "creative_preflight_result",
      source: "the-anti-balcony",
      status: nextStatus,
      metadata: {
        reviewStatus: review.status,
        moderationStatus: review.moderationStatus || null,
        checkoutReady,
        paymentPolicy: "charge_then_allocate_with_refund_fallback",
      },
      idempotency_key: `${order.id}:creative:${order.creative_path}`,
    });

    return NextResponse.json({
      status: nextStatus,
      reviewStatus: review.status,
      checkoutReady,
      notes: review.status === "manual_review"
        ? "Your file passed our technical checks. Final media-provider clearance will happen automatically after payment."
        : review.notes || null,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not complete creative review." }, { status: 400 });
  }
}
