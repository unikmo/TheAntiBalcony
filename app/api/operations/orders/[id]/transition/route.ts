import { NextResponse } from "next/server";
import { isOrderStatus, type PaymentStatus } from "@/lib/order-state";
import { transitionOrder } from "@/lib/orders";
import { authorizedByEnvironmentSecret } from "@/lib/tokens";

export const runtime = "nodejs";

const PAYMENT_STATUSES: PaymentStatus[] = ["not_requested", "pending", "manual_paid", "waived", "refunded"];

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!authorizedByEnvironmentSecret(request, "OPS_API_SECRET") && !authorizedByEnvironmentSecret(request, "FULFILLMENT_CALLBACK_SECRET")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;
    if (!isOrderStatus(body.status)) return NextResponse.json({ error: "A valid order status is required." }, { status: 400 });
    if (body.paymentStatus && !PAYMENT_STATUSES.includes(body.paymentStatus as PaymentStatus)) {
      return NextResponse.json({ error: "Invalid payment status." }, { status: 400 });
    }
    const result = await transitionOrder(id, {
      nextStatus: body.status,
      source: "operations",
      idempotencyKey: stringOrNull(body.idempotencyKey),
      paymentStatus: body.paymentStatus as PaymentStatus | undefined,
      providerCampaignId: stringOrNull(body.providerCampaignId),
      providerRef: stringOrNull(body.providerRef),
      providerModerationStatus: stringOrNull(body.providerModerationStatus),
      proofOfPlayRef: stringOrNull(body.proofOfPlayRef),
      scheduledWindowStart: stringOrNull(body.scheduledWindowStart),
      scheduledWindowEnd: stringOrNull(body.scheduledWindowEnd),
      playedAt: stringOrNull(body.playedAt),
      captureProvider: stringOrNull(body.captureProvider),
      captureJobId: stringOrNull(body.captureJobId),
      capturePath: stringOrNull(body.capturePath),
      deliverableVideoPath: stringOrNull(body.deliverableVideoPath),
      deliverableImagePath: stringOrNull(body.deliverableImagePath),
      reviewNotes: stringOrNull(body.reviewNotes),
      failureReason: stringOrNull(body.failureReason),
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Order transition failed." }, { status: 400 });
  }
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
