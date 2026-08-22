import { NextResponse } from "next/server";

export function GET() {
  const firebase = Boolean(
    process.env.FIRESTORE_EMULATOR_HOST ||
    (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ),
  );
  const stripe = Boolean(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_PRICE_SNAPSHOT &&
    process.env.STRIPE_PRICE_VIDEO &&
    process.env.STRIPE_PRICE_TAKEOVER &&
    process.env.STRIPE_PRICE_VIP,
  );
  const fulfillment = Boolean(
    process.env.ZAPIER_BILLBOARD_WEBHOOK_URL ||
    process.env.BILLBOARD_FULFILLMENT_WEBHOOK_URL,
  );
  const proof = Boolean(
    process.env.ZAPIER_PROOF_WEBHOOK_URL ||
    process.env.PROOF_CAPTURE_WEBHOOK_URL,
  );
  const social = Boolean(
    process.env.ZAPIER_SOCIAL_WEBHOOK_URL ||
    process.env.SOCIAL_PUBLISH_WEBHOOK_URL,
  );

  return NextResponse.json({
    ok: true,
    database: firebase,
    firebase,
    stripe,
    fulfillment,
    proof,
    social,
  });
}
