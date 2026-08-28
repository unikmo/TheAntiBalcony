import { createHash, randomBytes, randomUUID } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { checkBlindspotAvailability, confirmBlindspotBooking, DISPLAY_WINDOWS, type DisplayWindowCode, type MomentTier } from "@/lib/providers/blindspot";
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
  const orderRef = `AB-${input.eventDate.replaceAll("-", "")}-${orderId.slice(0, 8).toUpperCase()}`;
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
    status: "availability_check",
    payment_status: "not_requested",
    provider_name: "blindspot",
    capture_provider: null,
    creative_width: null,
    creative_height: null,
  });
  if (error) throw new Error(`Could not create booking: ${error.message}`);

  await addOrderEvent(orderId, "availability_check_started", "availability_check", {
    eventDate: input.eventDate,
    preferredWindow: input.preferredWindow,
    backupWindow: input.backupWindow || null,
    anyTimeSameDay: input.anyTimeSameDay,
  });

  let availability;
  try {
    availability = await checkBlindspotAvailability({
      orderId,
      orderRef,
      occasion: input.occasion,
      tier: input.tier,
      eventDate: input.eventDate,
      preferredWindow: input.preferredWindow,
      backupWindow: input.backupWindow || null,
      anyTimeSameDay: input.anyTimeSameDay,
      timezone: TIMEZONE,
      board,
    });
  } catch (error) {
    availability = { status: "manual_review" as const };
    await addOrderEvent(orderId, "availability_bridge_error", "manual_review", {
      message: error instanceof Error ? error.message : "Unknown provider error",
    });
  }

  const status = availability.status === "available"
    ? availability.holdRef ? "inventory_held" : "available"
    : availability.status;

  const resolvedCode = availability.resolvedWindow && availability.resolvedWindow !== "any"
    ? availability.resolvedWindow
    : null;
  const resolvedBounds = resolvedCode ? displayWindowBounds(input.eventDate, resolvedCode) : null;

  const { error: updateError } = await db.from("anti_balcony_orders").update({
    status,
    provider_ref: availability.providerRef || null,
    provider_hold_ref: availability.holdRef || null,
    provider_hold_expires_at: availability.holdExpiresAt || null,
    provider_quote: availability.quote || {},
    scheduled_window_start: availability.resolvedWindowStart || resolvedBounds?.start || null,
    scheduled_window_end: availability.resolvedWindowEnd || resolvedBounds?.end || null,
    updated_at: new Date().toISOString(),
  }).eq("id", orderId);
  if (updateError) throw new Error(`Could not update booking availability: ${updateError.message}`);

  await addOrderEvent(orderId, "availability_result", status, {
    providerRef: availability.providerRef || null,
    holdRef: availability.holdRef || null,
    resolvedWindow: availability.resolvedWindow || null,
  });

  const checkoutReady = availability.status === "available" && Boolean(
    availability.holdRef || process.env.BLINDSPOT_ALLOW_UNHELD_CHECKOUT === "true",
  );

  if (!checkoutReady) {
    await sendFounderEmail({
      to: input.email,
      subject: `We received your Times Square date — ${orderRef}`,
      html: `<p>We have your request for <strong>${input.eventDate}</strong>.</p><p>Your preferred display window is <strong>${DISPLAY_WINDOWS[input.preferredWindow].label} ET</strong>${input.backupWindow ? `, with ${DISPLAY_WINDOWS[input.backupWindow].label} ET as backup` : ""}.</p><p>We will not charge you until the display window is confirmed.</p>`,
    });
  }

  return {
    orderId,
    orderRef,
    accessToken,
    status,
    checkoutReady,
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

export async function completeMomentPayment(orderId: string, stripeSessionId: string) {
  const db = getSupabaseAdmin();
  if (!db) throw new Error("Booking database is not configured.");
  const order = await getOrderForCheckout(orderId);

  const { error: paidError } = await db.from("anti_balcony_orders").update({
    status: "paid",
    payment_status: "paid",
    stripe_session_id: stripeSessionId,
    updated_at: new Date().toISOString(),
  }).eq("id", orderId);
  if (paidError) throw new Error(`Could not record payment: ${paidError.message}`);
  await addOrderEvent(orderId, "payment_completed", "paid", { stripeSessionId });

  const confirmation = await confirmBlindspotBooking({
    orderId,
    orderRef: order.order_ref,
    holdRef: order.provider_hold_ref,
    providerRef: order.provider_ref,
    stripeSessionId,
  });

  if (confirmation.status !== "confirmed") {
    const status = confirmation.status === "failed" ? "failed" : "manual_review";
    await db.from("anti_balcony_orders").update({ status, updated_at: new Date().toISOString() }).eq("id", orderId);
    await addOrderEvent(orderId, "provider_confirmation_result", status, confirmation as unknown as Record<string, unknown>);
    return { status };
  }

  const scheduledWindowStart = confirmation.scheduledWindowStart || order.scheduled_window_start || order.requested_window_start;
  const scheduledWindowEnd = confirmation.scheduledWindowEnd || order.scheduled_window_end || order.requested_window_end;

  const { error: bookingError } = await db.from("anti_balcony_orders").update({
    status: "booked",
    provider_ref: confirmation.providerRef || order.provider_ref,
    provider_campaign_id: confirmation.campaignId || order.provider_campaign_id,
    scheduled_window_start: scheduledWindowStart,
    scheduled_window_end: scheduledWindowEnd,
    updated_at: new Date().toISOString(),
  }).eq("id", orderId);
  if (bookingError) throw new Error(`Could not confirm provider booking: ${bookingError.message}`);

  await addOrderEvent(orderId, "provider_booking_confirmed", "booked", {
    providerRef: confirmation.providerRef || order.provider_ref,
    campaignId: confirmation.campaignId || null,
    scheduledWindowStart,
    scheduledWindowEnd,
  });

  const capture = await armEarthCamCapture({
    orderId,
    orderRef: order.order_ref,
    eventDate: order.event_date || order.requested_window_start.slice(0, 10),
    scheduledWindowStart,
    scheduledWindowEnd,
    providerRef: confirmation.providerRef || order.provider_ref,
    providerCampaignId: confirmation.campaignId || order.provider_campaign_id,
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
    subject: `Your Times Square moment is booked — ${order.order_ref}`,
    html: `<p>Your display date is confirmed for <strong>${order.event_date || "your selected date"}</strong>.</p><p>Your confirmed window is a four-hour Times Square window. The exact playback minute is determined by the media schedule.</p><p>We will send your proof after the display.</p>`,
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
      subject: `Your Times Square proof is ready — ${order.order_ref}`,
      html: `<p>Your Times Square moment has been captured and the proof package is ready.</p>`,
    });
  }
  return { status: input.status };
}
