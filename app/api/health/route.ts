import { NextResponse } from "next/server";

export function GET() {
  const supabase = Boolean(
    (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
  );
  const stripe = Boolean(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_WEBHOOK_SECRET,
  );
  const blindspot = Boolean(process.env.BLINDSPOT_BOOKING_BRIDGE_URL || process.env.BLINDSPOT_API_BRIDGE_URL);
  const earthcam = Boolean(process.env.EARTHCAM_CAPTURE_BRIDGE_URL);
  const providerCallback = Boolean(process.env.PROVIDER_CALLBACK_SECRET || process.env.FULFILLMENT_CALLBACK_SECRET);
  const operations = Boolean(
    process.env.ZAPIER_OPERATIONS_WEBHOOK_URL ||
    process.env.ZAPIER_BILLBOARD_WEBHOOK_URL ||
    process.env.BILLBOARD_FULFILLMENT_WEBHOOK_URL,
  );
  const proof = Boolean(
    earthcam ||
    process.env.ZAPIER_OPERATIONS_WEBHOOK_URL ||
    process.env.ZAPIER_PROOF_WEBHOOK_URL ||
    process.env.PROOF_CAPTURE_WEBHOOK_URL,
  );
  const social = Boolean(process.env.ZAPIER_SOCIAL_WEBHOOK_URL || process.env.SOCIAL_PUBLISH_WEBHOOK_URL);

  const paymentsReady = supabase && stripe;
  const fulfillmentAutomationReady = paymentsReady && blindspot && providerCallback;
  const licensedCaptureReady = earthcam && providerCallback;

  return NextResponse.json({
    ok: true,
    brand: "the_pop_moment",
    operatingProject: "PlanetHike Project",
    database: supabase,
    supabase,
    stripe,
    paymentsReady,
    blindspot,
    earthcam,
    providerCallback,
    fulfillmentAutomationReady,
    licensedCaptureReady,
    bookingReady: paymentsReady,
    proofReady: proof && providerCallback,
    legacyOperations: operations,
    social,
  });
}
