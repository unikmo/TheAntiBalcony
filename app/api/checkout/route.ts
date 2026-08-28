import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getOrderForCheckout, markOrderPaymentPending } from "@/lib/orders";
import type { ProofTier } from "@/lib/providers/billboard";

export const runtime = "nodejs";

const LEGACY_TIER_PRICES: Record<ProofTier, string | undefined> = {
  snapshot: process.env.STRIPE_PRICE_SNAPSHOT,
  video: process.env.STRIPE_PRICE_VIDEO,
  takeover: process.env.STRIPE_PRICE_TAKEOVER,
  vip: process.env.STRIPE_PRICE_VIP,
};

const MOMENT_PRICES: Record<"snapshot" | "video" | "takeover", { amount: number; name: string; description: string }> = {
  snapshot: {
    amount: 39900,
    name: "The Pop Moment — Show It",
    description: "Times Square display + verified proof",
  },
  video: {
    amount: 79900,
    name: "The Pop Moment — Show + Keep",
    description: "Times Square display + proof + 15-second keepsake film",
  },
  takeover: {
    amount: 299900,
    name: "The Pop Moment — The Moment",
    description: "Coordinated Times Square experience + complete proof package",
  },
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
    const site = process.env.NEXT_PUBLIC_SITE_URL || "https://antibalcony.com";

    if (body.orderId) {
      const order = await getOrderForCheckout(body.orderId);
      const tier = order.tier as "snapshot" | "video" | "takeover";
      const price = MOMENT_PRICES[tier];

      if (!price) return NextResponse.json({ error: "Choose a valid Pop Moment package." }, { status: 400 });
      if (!order.creative_path || !order.creative_received_at) {
        return NextResponse.json({ error: "Upload and validate your creative before payment." }, { status: 409 });
      }
      if (order.status === "needs_changes") {
        return NextResponse.json({ error: "Your creative needs a change before payment." }, { status: 409 });
      }
      if (["cancelled", "failed"].includes(order.status)) {
        return NextResponse.json({ error: "This booking can no longer be paid. Start a new booking." }, { status: 409 });
      }
      if (order.payment_status === "paid") {
        return NextResponse.json({ error: "This booking has already been paid." }, { status: 409 });
      }
      if (order.payment_status === "refunded") {
        return NextResponse.json({ error: "This booking was refunded. Start a new booking." }, { status: 409 });
      }
      if (order.payment_status === "pending" && order.stripe_session_id) {
        const existing = await stripe.checkout.sessions.retrieve(order.stripe_session_id).catch(() => null);
        if (existing?.url && existing.status === "open") return NextResponse.json({ url: existing.url });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [{
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: price.amount,
            product_data: {
              name: price.name,
              description: price.description,
              metadata: {
                product: "the_pop_moment",
                package: tier,
              },
            },
          },
        }],
        customer_email: order.email,
        success_url: `${site}/book?checkout=reserved&order_ref=${encodeURIComponent(order.order_ref)}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${site}/book?checkout=cancelled`,
        client_reference_id: order.id,
        metadata: {
          flow: "moment_booking",
          brand: "the_pop_moment",
          operatingProject: "PlanetHike Project",
          orderId: order.id,
          orderRef: order.order_ref,
          tier,
          eventDate: order.event_date || "",
          preferredWindow: order.preferred_window_code || "",
          backupWindow: order.alternative_window_code || "",
          anyTimeSameDay: order.any_time_same_day === false ? "false" : "true",
        },
        payment_intent_data: {
          metadata: {
            flow: "moment_booking",
            brand: "the_pop_moment",
            operatingProject: "PlanetHike Project",
            orderId: order.id,
            orderRef: order.order_ref,
          },
        },
      }, {
        idempotencyKey: `${order.id}:checkout`,
      });

      if (!session.url) throw new Error("Stripe did not return a checkout URL.");
      await markOrderPaymentPending(order.id, session.id);
      return NextResponse.json({ url: session.url });
    }

    // Legacy founder-launch checkout remains available until those older flows are retired.
    const startupName = body.startupName?.trim().slice(0, 80);
    const email = body.email?.trim().slice(0, 254);
    const tier: ProofTier = body.tier && VALID_TIERS.includes(body.tier) ? body.tier : "snapshot";
    const priceId = LEGACY_TIER_PRICES[tier];
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
