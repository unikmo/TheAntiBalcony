import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
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
  const storage = Boolean(
    supabase &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  const blindspot = process.env.BLINDSPOT_BOOKING_WEBHOOK_URL
    ? "contracted_webhook"
    : operations
      ? "manual_operations"
      : "manual_required";
  const capture = process.env.LICENSED_CAPTURE_WEBHOOK_URL || process.env.EARTHCAM_CAPTURE_WEBHOOK_URL
    ? "licensed_webhook"
    : "manual_required";
  const packaging = process.env.SHOTSTACK_API_KEY ? "shotstack" : "manual_required";
  const email = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
  const db = getSupabaseAdmin();
  let popSchemaReady = false;
  if (db) {
    try { const result = await db.from("anti_balcony_pop_requests").select("id").limit(1); popSchemaReady = !result.error; }
    catch { popSchemaReady = false; }
  }

  return NextResponse.json({
    ok: true,
    database: supabase,
    supabase,
    stripe,
    orderIntake: false,
    popIntake: process.env.POP_INTAKE_ENABLED === "true" && popSchemaReady,
    popSchemaReady,
    checkoutEnabled: false,
    timesSquareBooking: "request_only",
    storage,
    blindspot,
    capture,
    packaging,
    email,
    operations,
    fulfillment: operations,
    proof,
    social,
  });
}
