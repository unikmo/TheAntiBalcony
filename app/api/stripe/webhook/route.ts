import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { beginPaidFulfillment, claimStripeEvent } from "@/lib/fulfillment";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });

  const signature = (await headers()).get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  const fresh = await claimStripeEvent(event.id);
  if (!fresh) return NextResponse.json({ received: true, duplicate: true });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata || {};
    const startupName = metadata.startupName;
    const email = session.customer_details?.email || metadata.email;
    if (!startupName || !email) return NextResponse.json({ error: "Checkout metadata is incomplete." }, { status: 422 });
    await beginPaidFulfillment({
      eventId: event.id,
      ringId: metadata.ringId || session.client_reference_id || null,
      startupName,
      email,
      stripeSessionId: session.id,
      allowSocial: metadata.allowSocial === "true",
    });
  }

  return NextResponse.json({ received: true });
}
