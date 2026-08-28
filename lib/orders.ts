import { createHash, randomBytes, randomUUID } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";
import {
  checkBlindspotAvailability,
  confirmBlindspotBooking,
  reviewBlindspotCreative,
  DISPLAY_WINDOWS,
  type DisplayWindowCode,
  type MomentTier,
} from "@/lib/providers/blindspot";
import { armEarthCamCapture } from "@/lib/providers/earthcam";
import { sendFounderEmail } from "@/lib/providers/email";

const TIMEZONE = "America/New_York" as const;

export type MomentOrderInput = {
  customerName: string;
  email: string;
  occasion: string;
  tier: MomentTier;
  eventDate: string;
  preferredWindow: DisplayWindowCode;
  backupWindow?: DisplayWindowCode | null;
  anyTimeSameDay: boolean;
  creativeMessage?: string | null;
  legalAccepted: boolean;
  board?: "times_square_flexible" | "nasdaq_tower";
};

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function addUtcDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + days));
  return value.toISOString().slice(0, 10);
}

function zonedHourToIso(date: string, hour: number, timeZone = TIMEZONE) {
  const targetDate = hour === 24 ? addUtcDays(date, 1) : date;
  const targetHour = hour === 24 ? 0 : hour;
  const [year, month, day] = targetDate.split("-").map(Number);
  const guess = Date.UTC(year, month - 1, day, targetHour, 0, 0);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(formatter.formatToParts(new Date(guess)).map((part) => [part.type, part.value]));
  const representedAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  const offset = representedAsUtc - guess;
  return new Date(guess - offset).toISOString();
}

export function displayWindowBounds(eventDate: string, code: DisplayWindowCode) {
  const window = DISPLAY_WINDOWS[code];
  return {
    start: zonedHourToIso(eventDate, window.startHour),
    end: zonedHourToIso(eventDate, window.endHour),
  };
}

function validateEventDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Choose a valid display date.");
  const requested = new Date(`${value}T23:59:59Z`).getTime();
  if (!Number.isFinite(requested) || requested < Date.now()) throw new Error("Choose a future display date.");
}

async function addOrderEvent(orderId: string, eventType: string, status?: string | null, metadata: Record<string, unknown> = {}) {
  const db = getSupabaseAdmin();
  if (!db) return;
  await db.from("anti_balcony_order_events").insert({
    id: randomUUID(),
    order_id: orderId,
    event_type: eventType,
    source: "the-anti-balcony",
    status: status || null,
    metadata,
    idempotency_key: `${orderId}:${eventType}:${Date.now()}`,
  });
}

export async function createMomentOrder(input: MomentOrderInput) {
  const db = getSupabaseAdmin();
  if (!db) throw new Error("Booking database is not configured.");

  validateEventDate(input.eventDate);
  if (!input.customerName.trim() || input.customerName.trim().length < 2) throw new Error("Add your name.");
  if (!/^\S+@\S+\.\S+$/.test(input.email.trim())) throw new Error("Add a valid email address.");
  if (!input.occasion.trim()) throw new Error("Choose the moment you are celebrating.");
  if (!input.legalAccepted) throw new Error("Accept the booking, rights, capture and privacy terms before continuing.");
  if (input.backupWindow && input.backupWindow === input.preferredWindow) throw new Error("Choose a different backup window.");

  const orderId = randomUUID();
  const accessToken = randomBytes(24).toString("hex");
  const orderRef = `PM-${input.eventDate.replaceAll("-", "")}-${orderId.slice(0, 8).toUpperCase()}`;
  const preferred = displayWindowBounds(input.eventDate, input.preferredWindow);
  const alternative = input.backupWindow ? displayWindowBounds(input.eventDate, input.backupWindow) : null;
  const now = new Date().toISOString();
  const board = input.board || "times_square_flexible";

  const { error } = await db.from("anti_balcony_orders").insert({
    id: orderId,
    order_ref: orderRef,
    access_token_hash: sha256(accessToken),
    ring_id: null,
    startup_name: input.customerName.trim().slice(0, 80),
    customer_name: input.customerName.trim().slice(0, 120),
    occasion: input.occasion.trim().slice(0, 80),
    creative_message: input.creativeMessage?.trim().slice(0, 240) || null,
    email: input.email.trim().toLowerCase().slice(0, 254),
    tier: input.tier,
    board,
    master_format: "9:16",
    timezone: TIMEZONE,
    event_date: input.eventDate,
    preferred_window_code: input.preferredWindow,
    alternative_window_code: input.backupWindow || null,
    requested_window_start: preferred.start,
    requested_window_end: preferred.end,
    alternative_window_start: alternative?.start || null,
    alternative_window_end: alternative?.end || null,
    any_time_same_day: input.anyTimeSameDay,
    allow_social: false,
    rights_accepted_at: now,
    qr_policy_accepted_at: now,
    capture_consent_at: now,
    terms_accepted_at: now,
    privacy_acknowledged_at: now,
    status: "creative_upload_pending",
    payment_status: "not_requested",
    provider_name: "blindspot",
    capture_provider: null,
    creative_width: null,
    creative_height: null,
  });
  if (error) throw new Error(`Could not create booking: ${error.message}`);

  await addOrderEvent(orderId, "booking_request_created", "creative_upload_pending", {
    eventDate: input.eventDate,
    preferredWindow: input.preferredWindow,
    backupWindow: input.backupWindow || null,
    anyTimeSameDay: input.anyTimeSameDay,
    paymentPolicy: "charge_then_allocate_with_refund_fallback",
  });

  return {
    orderId,
    orderRef,
    accessToken,
    status: "creative_upload_pending",
    checkoutReady: false,
    preferredWindowLabel: DISPLAY_WINDOWS[input.preferredWindow].label,
    backupWindowLabel: input.backupWindow ? DISPLAY_WINDOWS[input.backupWindow].label : null,
  };
}

export async function getOrderForCheckout(orderId: string) {
  const db = getSupabaseAdmin();
  if (!db) throw new Error("Booking database is not configured.");
  const { data, error } = await db.from("anti_balcony_orders").select("*").eq("id", orderId).maybeSingle();
  if (error) throw new Error(`Could not load booking: ${error.message}`);
  if (!data) throw new Error("Booking not found.");
  return data;
}

export async function markOrderPaymentPending(orderId: string, stripeSessionId: string) {
  const db = getSupabaseAdmin();
  if (!db) throw new Error("Booking database is not configured.");
  const { error } = await db.from("anti_balcony_orders").update({
    status: "payment_pending",
    payment_status: "pending",
    stripe_session_id: stripeSessionId,
    updated_at: new Date().toISOString(),
  }).eq("id", orderId);
  if (error) throw new Error(`Could not mark booking pending payment: ${error.message}`);
  await addOrderEvent(orderId, "stripe_checkout_created", "payment_pending", { stripeSessionId });
}

async function movePaidOrderToManualReview(order: Record<string, any>, reason: string, metadata: Record<string, unknown> = {}) {
  const db = getSupabaseAdmin();
  if (!db) throw new Error("Booking database is not configured.");
  await db.from("anti_balcony_orders").update({
    status: "manual_review",
    failure_reason: reason,
    updated_at: new Date().toISOString(),
  }).eq("id", order.id);
  await addOrderEvent(order.id, "paid_booking_manual_review", "manual_review", { reason, ...metadata });
  await sendFounderEmail({
    to: order.email,
    subject: `Payment received — we are securing your Pop Moment · ${order.order_ref}`,
    html: `<p>Your payment is received and your requested date is in our booking queue.</p><p>We are securing the best eligible Times Square placement within your selected same-day flexibility. If an exceptional inventory issue makes fulfillment impossible, we will automatically refund you in full.</p>`,
  });
  return { status: "manual_review" as const };
}

async function refundMomentPayment(order: Record<string, any>, stripeSessionId: string, reason: string) {
  const db = getSupabaseAdmin();
  if (!db) throw new Error("Booking database is not configured.");
  const stripe = getStripe();

  if (!stripe) {
    return movePaidOrderToManualReview(order, `Refund required but Stripe is unavailable: ${reason}`);
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
    const paymentIntentId = typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;
    if (!paymentIntentId) throw new Error("Stripe Checkout has no refundable PaymentIntent.");

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      metadata: {
        flow: "pop_moment_fulfillment_refund",
        orderId: order.id,
        orderRef: order.order_ref,
        reason: reason.slice(0, 450),
      },
    }, {
      idempotencyKey: `${order.id}:fulfillment-refund`,
    });

    await db.from("anti_balcony_orders").update({
      status: "cancelled",
      payment_status: "refunded",
      failure_reason: reason,
      updated_at: new Date().toISOString(),
    }).eq("id", order.id);

    await addOrderEvent(order.id, "automatic_full_refund_created", "cancelled", {
      refundId: refund.id,
      paymentIntentId,
      reason,
    });

    await sendFounderEmail({
      to: order.email,
      subject: `Automatic refund issued — ${order.order_ref}`,
      html: `<p>We could not secure an eligible Times Square placement for your selected date using the flexibility you gave us.</p><p>We have therefore issued a full automatic refund. Your bank or card provider may take several business days to show it.</p>`,
    });

    return { status: "cancelled" as const, refunded: true as const };
  } catch (error) {
    return movePaidOrderToManualReview(order, `Automatic refund needs manual handling: ${reason}`, {
      refundError: error instanceof Error ? error.message : "Unknown Stripe refund error",
    });
  }
}

export async function completeMomentPayment(orderId: string, stripeSessionId: string) {
  const db = getSupabaseAdmin();
  if (!db) throw new Error("Booking database is not configured.");
  const order = await getOrderForCheckout(orderId);

  if (order.payment_status === "refunded") return { status: "cancelled" as const };
  if (order.status === "scheduled" || order.status === "booked") return { status: "scheduled" as const };

  const { error: paidError } = await db.from("anti_balcony_orders").update({
    status: "booking",
    payment_status: "paid",
    stripe_session_id: stripeSessionId,
    updated_at: new Date().toISOString(),
  }).eq("id", orderId);
  if (paidError) throw new Error(`Could not record payment: ${paidError.message}`);
  await addOrderEvent(orderId, "payment_completed", "booking", { stripeSessionId });

  const eventDate = order.event_date || String(order.requested_window_start).slice(0, 10);
  const preferredWindow = order.preferred_window_code as DisplayWindowCode;
  const backupWindow = (order.alternative_window_code || null) as DisplayWindowCode | null;
  const tier = order.tier as MomentTier;
  const board = (order.board === "nasdaq_tower" ? "nasdaq_tower" : "times_square_flexible") as "nasdaq_tower" | "times_square_flexible";

  let availability;
  try {
    availability = await checkBlindspotAvailability({
      orderId,
      orderRef: order.order_ref,
      occasion: order.occasion || "Moment",
      tier,
      eventDate,
      preferredWindow,
      backupWindow,
      anyTimeSameDay: order.any_time_same_day !== false,
      timezone: TIMEZONE,
      board,
    });
  } catch (error) {
    return movePaidOrderToManualReview(order, "Blindspot availability bridge error after payment", {
      message: error instanceof Error ? error.message : "Unknown provider error",
    });
  }

  if (availability.status === "unavailable") {
    return refundMomentPayment(order, stripeSessionId, "No eligible Times Square inventory was available on the selected date across the permitted windows.");
  }
  if (availability.status === "manual_review") {
    return movePaidOrderToManualReview(order, "Provider availability requires manual review after payment");
  }

  const resolvedCode = availability.resolvedWindow && availability.resolvedWindow !== "any"
    ? availability.resolvedWindow
    : null;
  const resolvedBounds = resolvedCode ? displayWindowBounds(eventDate, resolvedCode) : null;
  const provisionalStart = availability.resolvedWindowStart || resolvedBounds?.start || order.requested_window_start;
  const provisionalEnd = availability.resolvedWindowEnd || resolvedBounds?.end || order.requested_window_end;

  await db.from("anti_balcony_orders").update({
    status: availability.holdRef ? "inventory_held" : "booking",
    provider_ref: availability.providerRef || null,
    provider_hold_ref: availability.holdRef || null,
    provider_hold_expires_at: availability.holdExpiresAt || null,
    provider_quote: availability.quote || {},
    scheduled_window_start: provisionalStart,
    scheduled_window_end: provisionalEnd,
    updated_at: new Date().toISOString(),
  }).eq("id", orderId);
  await addOrderEvent(orderId, "post_payment_availability_result", availability.holdRef ? "inventory_held" : "booking", {
    providerRef: availability.providerRef || null,
    holdRef: availability.holdRef || null,
    resolvedWindow: availability.resolvedWindow || null,
  });

  if (!order.creative_path || !order.creative_content_type || !order.creative_width || !order.creative_height) {
    return refundMomentPayment(order, stripeSessionId, "Creative file metadata was incomplete after payment.");
  }

  let creativeReview;
  try {
    creativeReview = await reviewBlindspotCreative({
      orderId,
      orderRef: order.order_ref,
      providerRef: availability.providerRef || null,
      holdRef: availability.holdRef || null,
      creativePath: order.creative_path,
      contentType: order.creative_content_type,
      width: order.creative_width,
      height: order.creative_height,
      durationSeconds: order.creative_duration_seconds,
    });
  } catch (error) {
    return movePaidOrderToManualReview(order, "Creative preflight bridge error after payment", {
      message: error instanceof Error ? error.message : "Unknown creative review error",
    });
  }

  if (creativeReview.status === "needs_changes") {
    return refundMomentPayment(order, stripeSessionId, creativeReview.notes || "The submitted creative could not be accepted for the selected media inventory.");
  }
  if (creativeReview.status === "manual_review") {
    return movePaidOrderToManualReview(order, "Creative requires manual provider review after payment", {
      notes: creativeReview.notes || null,
    });
  }

  const confirmation = await confirmBlindspotBooking({
    orderId,
    orderRef: order.order_ref,
    holdRef: availability.holdRef || null,
    providerRef: availability.providerRef || null,
    stripeSessionId,
  });

  if (confirmation.status === "failed") {
    return refundMomentPayment(order, stripeSessionId, "The provider could not finalize the eligible Times Square placement after payment.");
  }
  if (confirmation.status === "manual_review") {
    return movePaidOrderToManualReview(order, "Provider confirmation requires manual review after payment");
  }

  const scheduledWindowStart = confirmation.scheduledWindowStart || provisionalStart;
  const scheduledWindowEnd = confirmation.scheduledWindowEnd || provisionalEnd;

  const { error: bookingError } = await db.from("anti_balcony_orders").update({
    status: "booked",
    provider_ref: confirmation.providerRef || availability.providerRef || null,
    provider_campaign_id: confirmation.campaignId || null,
    scheduled_window_start: scheduledWindowStart,
    scheduled_window_end: scheduledWindowEnd,
    updated_at: new Date().toISOString(),
  }).eq("id", orderId);
  if (bookingError) throw new Error(`Could not confirm provider booking: ${bookingError.message}`);

  await addOrderEvent(orderId, "provider_booking_confirmed", "booked", {
    providerRef: confirmation.providerRef || availability.providerRef || null,
    campaignId: confirmation.campaignId || null,
    scheduledWindowStart,
    scheduledWindowEnd,
  });

  const capture = await armEarthCamCapture({
    orderId,
    orderRef: order.order_ref,
    eventDate,
    scheduledWindowStart,
    scheduledWindowEnd,
    providerRef: confirmation.providerRef || availability.providerRef || null,
    providerCampaignId: confirmation.campaignId || null,
  }).catch(() => ({ armed: false as const }));

  await db.from("anti_balcony_orders").update({
    capture_provider: capture.armed ? "earthcam" : null,
    capture_job_id: capture.armed ? capture.captureJobId : null,
    status: "scheduled",
    updated_at: new Date().toISOString(),
  }).eq("id", orderId);

  await addOrderEvent(orderId, "capture_window_armed", "scheduled", {
    captureProvider: capture.armed ? "earthcam" : null,
    captureJobId: capture.armed ? capture.captureJobId : null,
  });

  await sendFounderEmail({
    to: order.email,
    subject: `Your Pop Moment is booked — ${order.order_ref}`,
    html: `<p>Your Times Square display date is confirmed for <strong>${eventDate}</strong>.</p><p>Your confirmed placement sits inside a four-hour window. The exact playback minute is determined by the media schedule.</p><p>We will send your proof after the display.</p>`,
  });

  return { status: "scheduled" as const };
}

export async function updateMomentOrderFromProvider(input: {
  orderId: string;
  status: "scheduled" | "played" | "capture_processing" | "capture_ready" | "proof_ready" | "failed";
  providerRef?: string | null;
  campaignId?: string | null;
  proofOfPlayRef?: string | null;
  playedAt?: string | null;
  captureJobId?: string | null;
  capturePath?: string | null;
  deliverableVideoPath?: string | null;
  deliverableImagePath?: string | null;
  failureReason?: string | null;
}) {
  const db = getSupabaseAdmin();
  if (!db) throw new Error("Booking database is not configured.");
  const order = await getOrderForCheckout(input.orderId);
  const patch = {
    status: input.status,
    provider_ref: input.providerRef ?? order.provider_ref,
    provider_campaign_id: input.campaignId ?? order.provider_campaign_id,
    provider_proof_of_play_ref: input.proofOfPlayRef ?? order.provider_proof_of_play_ref,
    played_at: input.playedAt ?? order.played_at,
    capture_job_id: input.captureJobId ?? order.capture_job_id,
    capture_path: input.capturePath ?? order.capture_path,
    deliverable_video_path: input.deliverableVideoPath ?? order.deliverable_video_path,
    deliverable_image_path: input.deliverableImagePath ?? order.deliverable_image_path,
    failure_reason: input.failureReason ?? order.failure_reason,
    updated_at: new Date().toISOString(),
  };
  const { error } = await db.from("anti_balcony_orders").update(patch).eq("id", input.orderId);
  if (error) throw new Error(`Could not update provider status: ${error.message}`);
  await addOrderEvent(input.orderId, "provider_callback", input.status, input as unknown as Record<string, unknown>);

  if (input.status === "proof_ready") {
    await sendFounderEmail({
      to: order.email,
      subject: `Your Pop Moment proof is ready — ${order.order_ref}`,
      html: `<p>Your Times Square moment has been captured and the proof package is ready.</p>`,
    });
  }
  return { status: input.status };
}
