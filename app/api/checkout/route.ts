import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getOrderForCheckout, markOrderPaymentPending } from "@/lib/orders";
import type { ProofTier } from "@/lib/providers/billboard";

export const runtime = "nodejs";

const TIER_PRICES: Record<ProofTier, string | undefined> = {
  snapshot: process.env.STRIPE_PRICE_SNAPSHOT,
  video: process.env.STRIPE_PRICE_VIDEO,
  takeover: process.env.STRIPE_PRICE_TAKEOVER,
  vip: process.env.STRIPE_PRICE_VIP,
};
const VALID_TIERS: ProofTier[] = ["snapshot", "video", "takeover", "vip"];

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Paid checkout is not configured yet." }, { status: 503 });

  try {
    const body = (await request.json()) as {
      orderId?: string;
      ringId?: string;
      startupName?: string;
      email?: string;
      allowSocial?: boolean;
      tier?: ProofTier;
    };
    const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    if (body.orderId) {
      const order = await getOrderForCheckout(body.orderId);
      const tier = order.tier as ProofTier;
      const priceId = TIER_PRICES[tier];
      const holdReady = order.status === "inventory_held" || (order.status === "available" && process.env.BLINDSPOT_ALLOW_UNHELD_CHECKOUT === "true");
      if (!holdReady) return NextResponse.json({ error: "We have not confirmed inventory for this date/window yet. You will not be charged until it is confirmed." }, { status: 409 });
      if (!priceId) return NextResponse.json({ error: `${tier} checkout is not configured yet.` }, { status: 503 });

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [{ price: priceId, quantity: 1 }],
        customer_email: order.email,
        success_url: `${site}/book?checkout=reserved&order_ref=${encodeURIComponent(order.order_ref)}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${site}/book?checkout=cancelled`,
        client_reference_id: order.id,
        metadata: {
          flow: "moment_booking",
          orderId: order.id,
          orderRef: order.order_ref,
          tier,
          eventDate: order.event_date || "",
          preferredWindow: order.preferred_window_code || "",
        },
      });
      if (!session.url) throw new Error("Stripe did not return a checkout URL.");
      await markOrderPaymentPending(order.id, session.id);
      return NextResponse.json({ url: session.url });
    }

    const startupName = body.startupName?.trim().slice(0, 80);
    const email = body.email?.trim().slice(0, 254);
    const tier: ProofTier = body.tier && VALID_TIERS.includes(body.tier) ? body.tier : "snapshot";
    const priceId = TIER_PRICES[tier];
    if (!startupName || !email) return NextResponse.json({ error: "Startup name and email are required." }, { status: 400 });
    if (!priceId) return NextResponse.json({ error: `${tier} checkout is not configured yet.` }, { status: 503 });

    const isConcierge = tier === "takeover" || tier === "vip";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      success_url: `${site}/?checkout=reserved&tier=${tier}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/?checkout=cancelled`,
      client_reference_id: body.ringId || undefined,
      metadata: { ringId: body.ringId || "", startupName, email, tier, allowSocial: body.allowSocial ? "true" : "false", requiresOperationsClearance: isConcierge ? "true" : "false" },
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create checkout." }, { status: 400 });
  }
}
