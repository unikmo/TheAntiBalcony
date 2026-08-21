import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripe();
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!stripe || !priceId) {
    return NextResponse.json({ error: "Paid checkout is not configured yet." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      ringId?: string;
      startupName?: string;
      email?: string;
      allowSocial?: boolean;
    };
    const startupName = body.startupName?.trim().slice(0, 80);
    const email = body.email?.trim().slice(0, 254);
    if (!startupName || !email) return NextResponse.json({ error: "Startup name and email are required." }, { status: 400 });

    const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      success_url: `${site}/?checkout=reserved&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/?checkout=cancelled`,
      client_reference_id: body.ringId || undefined,
      metadata: {
        ringId: body.ringId || "",
        startupName,
        email,
        allowSocial: body.allowSocial ? "true" : "false",
      },
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create checkout.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
