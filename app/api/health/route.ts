import { NextResponse } from "next/server";

export function GET() {
  const supabase = Boolean(
    (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
  );
  const stripe = Boolean(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_PRICE_SNAPSHOT &&
    process.env.STRIPE_PRICE_VIDEO &&
    process.env.STRIPE_PRICE_TAKEOVER &&
    process.env.STRIPE_PRICE_VIP,
  );
  const operations = Boolean(
    process.env.ZAPIER_OPERATIONS_WEBHOOK_URL ||
    process.env.ZAPIER_BILLBOARD_WEBHOOK_URL ||
    process.env.BILLBOARD_FULFILLMENT_WEBHOOK_URL,
  );
  const proof = Boolean(
    process.env.ZAPIER_OPERATIONS_WEBHOOK_URL ||
    process.env.ZAPIER_PROOF_WEBHOOK_URL ||
    process.env.PROOF_CAPTURE_WEBHOOK_URL,
  );
  const social = Boolean(
    process.env.ZAPIER_SOCIAL_WEBHOOK_URL ||
    process.env.SOCIAL_PUBLISH_WEBHOOK_URL,
  );

  return NextResponse.json({
    ok: true,
    database: supabase,
    supabase,
    stripe,
    operations,
    fulfillment: operations,
    proof,
    social,
  });
}
