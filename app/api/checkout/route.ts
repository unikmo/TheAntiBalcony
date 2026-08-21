import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
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
  if (!stripe) {
    return NextResponse.json({ error: "Paid checkout is not configured yet." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      ringId?: string;
      startupName?: string;
      email?: string;
      allowSocial?: boolean;
      tier?: ProofTier;
    };

    const startupName = body.startupName?.trim().slice(0, 80);
    const email = body.email?.trim().slice(0, 254);
    const tier: ProofTier = body.tier && VALID_TIERS.includes(body.tier) ? body.tier : "snapshot";
    const priceId = TIER_PRICES[tier];

    if (!startupName || !email) {
      return NextResponse.json({ error: "Startup name and email are required." }, { status: 400 });
    }
    if (!priceId) {
      return NextResponse.json({ error: `${tier} checkout is not configured yet.` }, { status: 503 });
    }

    const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const isConcierge = tier === "takeover" || tier === "vip";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      success_url: `${site}/?checkout=reserved&tier=${tier}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/?checkout=cancelled`,
      client_reference_id: body.ringId || undefined,
      metadata: {
        ringId: body.ringId || "",
        startupName,
        email,
        tier,
        allowSocial: body.allowSocial ? "true" : "false",
        requiresOperationsClearance: isConcierge ? "true" : "false",
      },
    });

    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create checkout.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
