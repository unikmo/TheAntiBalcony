import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    database: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    stripe: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID),
    fulfillment: Boolean(process.env.BILLBOARD_FULFILLMENT_WEBHOOK_URL),
    proof: Boolean(process.env.PROOF_CAPTURE_WEBHOOK_URL),
  });
}
