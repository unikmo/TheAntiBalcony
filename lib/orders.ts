import { randomBytes, randomUUID } from "node:crypto";
import type { Database, Json } from "@/lib/database.types";
import { validateCreativeSpec } from "@/lib/creative-spec";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getRingBySlug, updateRingStatus } from "@/lib/rings";
import { createCapabilityToken, hashToken, tokensMatch } from "@/lib/tokens";
import {
  createCreativeUpload,
  createPrivateDownloadUrl,
  copyRemoteAsset,
  MEDIA_BUCKETS,
  validateCreativeFile,
  verifyStoredObject,
} from "@/lib/media-storage";
import { assertOrderTransition, type OrderStatus, type PaymentStatus, statusLabel } from "@/lib/order-state";
import { dispatchBlindspotBookingRequest } from "@/lib/providers/blindspot";
import { requestLicensedCapture } from "@/lib/providers/capture";
import { getShotstackRender, shotstackConfigured, submitShotstackPackaging } from "@/lib/providers/shotstack";
import { sendFounderEmail } from "@/lib/providers/email";

type OrderRow = Database["public"]["Tables"]["anti_balcony_orders"]["Row"];
type OrderSource = Database["public"]["Tables"]["anti_balcony_order_events"]["Row"]["source"];
export type OrderTier = OrderRow["tier"];

export type CreateOrderInput = {
  ringId: string;
  tier: OrderTier;
  email: string;
  timezone: string;
  requestedWindowStart: string;
  requestedWindowEnd: string;
  alternativeWindowStart?: string | null;
  alternativeWindowEnd?: string | null;
  creativeFilename: string;
  creativeContentType: string;
  creativeSize: number;
  creativeWidth: number;
  creativeHeight: number;
  creativeDurationSeconds?: number | null;
  allowSocial?: boolean;
  rightsAccepted: boolean;
  qrPolicyAccepted: boolean;
  captureConsent: boolean;
  termsAccepted: boolean;
  privacyAcknowledged: boolean;
};

export type TransitionOrderInput = {
  nextStatus: OrderStatus;
  source: OrderSource;
  idempotencyKey?: string | null;
  paymentStatus?: PaymentStatus;
  providerCampaignId?: string | null;
  providerRef?: string | null;
  providerModerationStatus?: string | null;
  proofOfPlayRef?: string | null;
  scheduledWindowStart?: string | null;
  scheduledWindowEnd?: string | null;
  playedAt?: string | null;
  captureProvider?: string | null;
  captureJobId?: string | null;
  capturePath?: string | null;
  deliverableVideoPath?: string | null;
  deliverableImagePath?: string | null;
  reviewNotes?: string | null;
  failureReason?: string | null;
};

export async function createOrderRequest(input: CreateOrderInput) {
  const db = requireDatabase();
  validateCreateOrderInput(input);
  const ring = await getRingBySlug(input.ringId);
  if (!ring) throw new Error("Create and persist the public Ring before requesting a Times Square package.");

  const normalizedEmail = normalizeEmail(input.email);
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await db
    .from("anti_balcony_orders")
    .select("id", { count: "exact", head: true })
    .eq("ring_id", ring.id)
    .eq("email", normalizedEmail)
    .gte("created_at", cutoff);
  if (countError) throw new Error(`Could not validate request limits: ${countError.message}`);
  if ((count || 0) >= 5) throw new Error("This Ring has reached its request limit for today. Try again tomorrow or contact hello@antibalcony.com.");

  const id = randomUUID();
  const accessToken = createCapabilityToken();
  const orderRef = `AB-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomBytes(3).toString("hex").toUpperCase()}`;
  const creative = validateCreativeFile({
    name: input.creativeFilename,
    type: input.creativeContentType,
    size: input.creativeSize,
  });
  const upload = await createCreativeUpload({
    orderId: id,
    filename: creative.filename,
    contentType: creative.contentType,
    size: creative.size,
  });
  const now = new Date().toISOString();
  const { error } = await db.from("anti_balcony_orders").insert({
    id,
    order_ref: orderRef,
    access_token_hash: hashToken(accessToken),
    ring_id: ring.id,
    startup_name: ring.startupName,
    email: normalizedEmail,
    tier: input.tier,
    timezone: input.timezone,
    requested_window_start: new Date(input.requestedWindowStart).toISOString(),
    requested_window_end: new Date(input.requestedWindowEnd).toISOString(),
    alternative_window_start: input.alternativeWindowStart ? new Date(input.alternativeWindowStart).toISOString() : null,
    alternative_window_end: input.alternativeWindowEnd ? new Date(input.alternativeWindowEnd).toISOString() : null,
    allow_social: Boolean(input.allowSocial),
    rights_accepted_at: now,
    qr_policy_accepted_at: now,
    capture_consent_at: now,
    terms_accepted_at: now,
    privacy_acknowledged_at: now,
    status: "creative_upload_pending",
    payment_status: "not_requested",
    creative_path: upload.path,
    creative_filename: creative.filename,
    creative_content_type: creative.contentType,
    creative_size_bytes: creative.size,
    creative_width: input.creativeWidth,
    creative_height: input.creativeHeight,
    creative_duration_seconds: input.creativeDurationSeconds ?? null,
    created_at: now,
    updated_at: now,
  });
  if (error) throw new Error(`Could not create order request: ${error.message}`);
  await recordOrderEvent(id, "order_created", "creative_upload_pending", "customer", {
    tier: input.tier,
    board: "nasdaq_tower",
    requestedWindowStart: input.requestedWindowStart,
    requestedWindowEnd: input.requestedWindowEnd,
  });

  return {
    order: { id, orderRef, startupName: ring.startupName, status: "creative_upload_pending" as const },
    accessToken,
    upload: {
      bucket: upload.bucket,
      path: upload.path,
      token: upload.token,
      endpoint: upload.endpoint,
      publishableKey: upload.publishableKey,
      contentType: creative.contentType,
      filename: creative.filename,
    },
  };
}

export async function completeCreativeUpload(orderId: string, accessToken: string) {
  const db = requireDatabase();
  const order = await getAuthorizedOrder(orderId, accessToken);
  if (!["creative_upload_pending", "needs_changes"].includes(order.status)) {
    throw new Error("This creative upload has already been finalized.");
  }
  if (!order.creative_path) throw new Error("Order has no creative upload path.");
  const object = await verifyStoredObject(MEDIA_BUCKETS.creative, order.creative_path);
  const metadata = (object.metadata || {}) as Record<string, unknown>;
  const storedSize = Number(metadata.size || order.creative_size_bytes || 0);
  const storedType = String(metadata.mimetype || metadata.contentType || order.creative_content_type || "").toLowerCase();
  validateCreativeFile({
    name: order.creative_filename || object.name,
    type: storedType,
    size: storedSize,
  });

  const now = new Date().toISOString();
  const { error } = await db.from("anti_balcony_orders").update({
    status: "availability_check",
    creative_received_at: now,
    creative_content_type: storedType,
    creative_size_bytes: storedSize,
    updated_at: now,
  }).eq("id", order.id);
  if (error) throw new Error(`Could not finalize creative upload: ${error.message}`);
  await recordOrderEvent(order.id, "creative_received", "availability_check", "customer", {
    path: order.creative_path,
    contentType: storedType,
    size: storedSize,
  });

  const warnings: string[] = [];
  try {
    const result = await dispatchBlindspotBookingRequest({
      orderId: order.id,
      orderRef: order.order_ref,
      ringId: order.ring_id,
      startupName: order.startup_name,
      email: order.email,
      tier: order.tier,
      timezone: order.timezone,
      requestedWindowStart: order.requested_window_start,
      requestedWindowEnd: order.requested_window_end,
      alternativeWindowStart: order.alternative_window_start,
      alternativeWindowEnd: order.alternative_window_end,
      creativePath: order.creative_path,
      creativeContentType: storedType,
      creativeWidth: order.creative_width,
      creativeHeight: order.creative_height,
      creativeDurationSeconds: order.creative_duration_seconds,
    });
    await recordOrderEvent(order.id, "blindspot_request_dispatched", "availability_check", "system", result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Blindspot operations dispatch failed.";
    warnings.push(message);
    await recordOrderEvent(order.id, "blindspot_request_failed", "availability_check", "system", { error: message });
  }

  try {
    const email = await sendFounderEmail({
      to: order.email,
      subject: `${order.startup_name}: Times Square request received`,
      idempotencyKey: `order-received-${order.id}`,
      html: `<p>We received the creative for <strong>${escapeHtml(order.startup_name)}</strong>.</p><p>Reference: <strong>${escapeHtml(order.order_ref)}</strong></p><p>We are checking NASDAQ Tower availability and creative compatibility. No payment has been taken. We will only request payment after the placement and creative are confirmed.</p>`,
    });
    await recordOrderEvent(order.id, "customer_acknowledgement", "availability_check", "email", { sent: email.sent, id: email.sent ? email.id : null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acknowledgement email failed.";
    warnings.push(message);
    await recordOrderEvent(order.id, "customer_acknowledgement_failed", "availability_check", "email", { error: message });
  }

  return { order: { id: order.id, orderRef: order.order_ref, status: "availability_check" as const }, warnings };
}

export async function getCustomerOrder(orderId: string, accessToken: string) {
  const order = await getAuthorizedOrder(orderId, accessToken);
  const [videoUrl, imageUrl] = await Promise.all([
    order.deliverable_video_path
      ? createPrivateDownloadUrl(MEDIA_BUCKETS.deliverables, order.deliverable_video_path, 7 * 24 * 60 * 60)
      : Promise.resolve(null),
    order.deliverable_image_path
      ? createPrivateDownloadUrl(MEDIA_BUCKETS.deliverables, order.deliverable_image_path, 7 * 24 * 60 * 60)
      : Promise.resolve(null),
  ]);
  return {
    id: order.id,
    orderRef: order.order_ref,
    startupName: order.startup_name,
    tier: order.tier,
    status: order.status,
    statusLabel: statusLabel(order.status as OrderStatus),
    paymentStatus: order.payment_status,
    requestedWindowStart: order.requested_window_start,
    requestedWindowEnd: order.requested_window_end,
    scheduledWindowStart: order.scheduled_window_start,
    scheduledWindowEnd: order.scheduled_window_end,
    providerCampaignId: order.provider_campaign_id,
    proofOfPlayRef: order.provider_proof_of_play_ref,
    videoUrl,
    imageUrl,
    deliveredAt: order.delivered_at,
  };
}

export async function transitionOrder(orderId: string, input: TransitionOrderInput) {
  const db = requireDatabase();
  const order = await getOrder(orderId);
  if (input.idempotencyKey) {
    const { data: existing, error: idempotencyError } = await db
      .from("anti_balcony_order_events")
      .select("id")
      .eq("order_id", orderId)
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle();
    if (idempotencyError) throw new Error(`Could not verify callback idempotency: ${idempotencyError.message}`);
    if (existing) return { order, duplicate: true as const };
  }
  const nextPaymentStatus = input.paymentStatus || (order.payment_status as PaymentStatus);
  assertOrderTransition({
    current: order.status as OrderStatus,
    next: input.nextStatus,
    paymentStatus: nextPaymentStatus,
  });
  validateTransition(order, input, nextPaymentStatus);
  if (input.nextStatus === "capture_ready" && (input.capturePath || order.capture_path)) {
    await verifyStoredObject(MEDIA_BUCKETS.capture, input.capturePath || order.capture_path || "");
  }
  if (input.nextStatus === "proof_ready") {
    if (input.deliverableVideoPath || order.deliverable_video_path) {
      await verifyStoredObject(MEDIA_BUCKETS.deliverables, input.deliverableVideoPath || order.deliverable_video_path || "");
    }
    if (input.deliverableImagePath || order.deliverable_image_path) {
      await verifyStoredObject(MEDIA_BUCKETS.deliverables, input.deliverableImagePath || order.deliverable_image_path || "");
    }
  }
  const now = new Date().toISOString();
  const patch: Database["public"]["Tables"]["anti_balcony_orders"]["Update"] = {
    status: input.nextStatus,
    payment_status: nextPaymentStatus,
    provider_campaign_id: input.providerCampaignId ?? order.provider_campaign_id,
    provider_ref: input.providerRef ?? order.provider_ref,
    provider_moderation_status: input.providerModerationStatus ?? order.provider_moderation_status,
    provider_proof_of_play_ref: input.proofOfPlayRef ?? order.provider_proof_of_play_ref,
    scheduled_window_start: input.scheduledWindowStart ?? order.scheduled_window_start,
    scheduled_window_end: input.scheduledWindowEnd ?? order.scheduled_window_end,
    played_at: input.playedAt ?? order.played_at,
    capture_provider: input.captureProvider ?? order.capture_provider,
    capture_job_id: input.captureJobId ?? order.capture_job_id,
    capture_path: input.capturePath ?? order.capture_path,
    creative_review_notes: input.reviewNotes ?? order.creative_review_notes,
    deliverable_video_path: input.deliverableVideoPath ?? order.deliverable_video_path,
    deliverable_image_path: input.deliverableImagePath ?? order.deliverable_image_path,
    failure_reason: input.failureReason ?? order.failure_reason,
    updated_at: now,
    ...(input.nextStatus === "capture_ready" ? { capture_completed_at: now } : {}),
  };
  const { error } = await db.from("anti_balcony_orders").update(patch).eq("id", order.id);
  if (error) throw new Error(`Could not update order: ${error.message}`);
  await recordOrderEvent(order.id, `status_${input.nextStatus}`, input.nextStatus, input.source, {
    paymentStatus: nextPaymentStatus,
    providerCampaignId: input.providerCampaignId || null,
    providerRef: input.providerRef || null,
    proofOfPlayRef: input.proofOfPlayRef || null,
    reviewNotes: input.reviewNotes || null,
  }, input.idempotencyKey || undefined);

  const updated = await getOrder(order.id);
  await updateRingStatus(updated.ring_id, input.nextStatus, updated.tier);

  if (input.nextStatus === "scheduled") await sendScheduledEmail(updated);
  if (input.nextStatus === "played") return startCapture(updated);
  if (input.nextStatus === "capture_ready") return startPackaging(updated);
  if (input.nextStatus === "proof_ready") return deliverOrder(updated);
  return { order: updated };
}

export async function completeLicensedCapture(input: {
  orderId: string;
  provider: string;
  captureJobId?: string | null;
  sourceUrl?: string | null;
  capturePath?: string | null;
  idempotencyKey?: string | null;
}) {
  const order = await getOrder(input.orderId);
  if (!["capture_required", "capture_processing"].includes(order.status)) {
    throw new Error("Order is not waiting for capture.");
  }
  let capturePath = input.capturePath || null;
  if (capturePath) {
    if (!capturePath.startsWith(`${order.id}/`)) throw new Error("Capture path must belong to this order.");
    await verifyStoredObject(MEDIA_BUCKETS.capture, capturePath);
  } else if (input.sourceUrl) {
    validateHttpUrl(input.sourceUrl);
    capturePath = `${order.id}/licensed-capture-${Date.now()}.mp4`;
    await copyRemoteAsset({
      sourceUrl: input.sourceUrl,
      bucket: MEDIA_BUCKETS.capture,
      path: capturePath,
      allowedTypes: ["video/mp4", "video/quicktime", "video/webm"],
    });
  } else {
    throw new Error("Capture callback requires sourceUrl or capturePath.");
  }
  return transitionOrder(order.id, {
    nextStatus: "capture_ready",
    source: "capture",
    idempotencyKey: input.idempotencyKey,
    captureProvider: input.provider,
    captureJobId: input.captureJobId,
    capturePath,
  });
}

export async function completeShotstackPackaging(orderId: string, rawToken: string) {
  const db = requireDatabase();
  const order = await getOrder(orderId);
  if (!order.render_callback_token_hash || !tokensMatch(rawToken, order.render_callback_token_hash)) {
    throw new Error("Invalid Shotstack callback token.");
  }
  if (!order.render_job_id) throw new Error("Order has no Shotstack render job.");
  const render = await getShotstackRender(order.render_job_id);
  if (render.status === "failed") {
    const message = render.error || "Shotstack render failed.";
    const { error } = await db.from("anti_balcony_orders").update({
      status: "packaging_required",
      render_error: message,
      updated_at: new Date().toISOString(),
    }).eq("id", order.id);
    if (error) throw new Error(`Could not record render failure: ${error.message}`);
    await recordOrderEvent(order.id, "shotstack_failed", "packaging_required", "shotstack", { error: message }, `shotstack-failed-${order.render_job_id}`);
    return { status: "packaging_required" as const };
  }
  if (render.status !== "done" || !render.url) return { status: render.status || "unknown" };

  const videoPath = `${order.id}/${order.order_ref.toLowerCase()}-times-square.mp4`;
  await copyRemoteAsset({
    sourceUrl: render.url,
    bucket: MEDIA_BUCKETS.deliverables,
    path: videoPath,
    allowedTypes: ["video/mp4"],
  });
  let imagePath: string | null = null;
  if (render.poster) {
    imagePath = `${order.id}/${order.order_ref.toLowerCase()}-times-square.jpg`;
    await copyRemoteAsset({
      sourceUrl: render.poster,
      bucket: MEDIA_BUCKETS.deliverables,
      path: imagePath,
      allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    });
  }
  return transitionOrder(order.id, {
    nextStatus: "proof_ready",
    source: "shotstack",
    idempotencyKey: `shotstack-done-${order.render_job_id}`,
    deliverableVideoPath: videoPath,
    deliverableImagePath: imagePath,
  });
}

async function startCapture(order: OrderRow) {
  if (!order.provider_proof_of_play_ref || !order.played_at) {
    throw new Error("Played order requires proof-of-play reference and exact play timestamp.");
  }
  const result = await requestLicensedCapture({
    orderId: order.id,
    orderRef: order.order_ref,
    startupName: order.startup_name,
    providerCampaignId: order.provider_campaign_id,
    proofOfPlayRef: order.provider_proof_of_play_ref,
    playedAt: order.played_at,
    scheduledWindowStart: order.scheduled_window_start,
    scheduledWindowEnd: order.scheduled_window_end,
  });
  const nextStatus: OrderStatus = result.requested ? "capture_processing" : "capture_required";
  const db = requireDatabase();
  const now = new Date().toISOString();
  const { error } = await db.from("anti_balcony_orders").update({
    status: nextStatus,
    capture_provider: result.requested ? result.mode : null,
    capture_started_at: result.requested ? now : null,
    updated_at: now,
  }).eq("id", order.id);
  if (error) throw new Error(`Could not start capture: ${error.message}`);
  await recordOrderEvent(order.id, result.requested ? "capture_requested" : "capture_manual_required", nextStatus, "system", result);
  return { order: await getOrder(order.id), capture: result };
}

async function startPackaging(order: OrderRow) {
  if (!order.capture_path) throw new Error("Capture-ready order requires a private capture path.");
  if (!shotstackConfigured()) {
    const db = requireDatabase();
    const { error } = await db.from("anti_balcony_orders").update({
      status: "packaging_required",
      updated_at: new Date().toISOString(),
    }).eq("id", order.id);
    if (error) throw new Error(`Could not queue manual packaging: ${error.message}`);
    await recordOrderEvent(order.id, "packaging_manual_required", "packaging_required", "system", {});
    return { order: await getOrder(order.id), packaging: { submitted: false as const } };
  }

  const captureUrl = await createPrivateDownloadUrl(MEDIA_BUCKETS.capture, order.capture_path, 6 * 60 * 60);
  const callbackToken = createCapabilityToken();
  const result = await submitShotstackPackaging({
    orderId: order.id,
    orderRef: order.order_ref,
    startupName: order.startup_name,
    captureUrl,
    callbackToken,
  });
  if (!result.submitted) throw new Error("Shotstack packaging was not submitted.");
  const db = requireDatabase();
  const { error } = await db.from("anti_balcony_orders").update({
    status: "packaging",
    render_provider: "shotstack",
    render_job_id: result.id,
    render_callback_token_hash: hashToken(callbackToken),
    render_error: null,
    updated_at: new Date().toISOString(),
  }).eq("id", order.id);
  if (error) throw new Error(`Could not save Shotstack render: ${error.message}`);
  await recordOrderEvent(order.id, "shotstack_queued", "packaging", "shotstack", { renderId: result.id, environment: result.stage });
  return { order: await getOrder(order.id), packaging: result };
}

async function deliverOrder(order: OrderRow) {
  if (!order.deliverable_video_path && !order.deliverable_image_path) {
    throw new Error("proof_ready requires at least one private deliverable path.");
  }
  const [videoUrl, imageUrl] = await Promise.all([
    order.deliverable_video_path
      ? createPrivateDownloadUrl(MEDIA_BUCKETS.deliverables, order.deliverable_video_path, 7 * 24 * 60 * 60)
      : Promise.resolve(null),
    order.deliverable_image_path
      ? createPrivateDownloadUrl(MEDIA_BUCKETS.deliverables, order.deliverable_image_path, 7 * 24 * 60 * 60)
      : Promise.resolve(null),
  ]);
  const links = [
    videoUrl ? `<p><a href="${escapeAttribute(videoUrl)}">Download your 9:16 Times Square video</a></p>` : "",
    imageUrl ? `<p><a href="${escapeAttribute(imageUrl)}">Download your Times Square still</a></p>` : "",
  ].join("");
  const result = await sendFounderEmail({
    to: order.email,
    subject: `${order.startup_name} is live in Times Square`,
    idempotencyKey: `delivery-${order.id}`,
    html: `<p><strong>${escapeHtml(order.startup_name)}</strong> has a confirmed Times Square moment.</p><p>Reference: ${escapeHtml(order.order_ref)}</p>${links}<p>These private links expire in seven days. Download and keep the original files.</p>`,
  });
  if (!result.sent) {
    await recordOrderEvent(order.id, "delivery_email_not_configured", "proof_ready", "email", {});
    return { order, delivered: false as const };
  }
  const db = requireDatabase();
  const now = new Date().toISOString();
  const { error } = await db.from("anti_balcony_orders").update({
    status: "delivered",
    delivery_email_id: result.id,
    delivered_at: now,
    updated_at: now,
  }).eq("id", order.id);
  if (error) throw new Error(`Could not mark delivery complete: ${error.message}`);
  await recordOrderEvent(order.id, "delivery_sent", "delivered", "email", { emailId: result.id }, `delivery-${order.id}`);
  await updateRingStatus(order.ring_id, "delivered", order.tier);
  return { order: await getOrder(order.id), delivered: true as const };
}

async function sendScheduledEmail(order: OrderRow) {
  const when = order.scheduled_window_start
    ? new Intl.DateTimeFormat("en", { dateStyle: "full", timeStyle: "short", timeZone: order.timezone }).format(new Date(order.scheduled_window_start))
    : "the confirmed window";
  const result = await sendFounderEmail({
    to: order.email,
    subject: `${order.startup_name}: NASDAQ Tower placement scheduled`,
    idempotencyKey: `scheduled-${order.id}-${order.scheduled_window_start || "pending"}`,
    html: `<p><strong>${escapeHtml(order.startup_name)}</strong> is scheduled for the NASDAQ Tower.</p><p>Your one-hour placement window begins <strong>${escapeHtml(when)}</strong>.</p><p>Campaign reference: ${escapeHtml(order.provider_campaign_id || order.provider_ref || order.order_ref)}</p>`,
  });
  await recordOrderEvent(order.id, "scheduled_email", "scheduled", "email", { sent: result.sent, id: result.sent ? result.id : null });
}

async function getAuthorizedOrder(orderId: string, accessToken: string) {
  const order = await getOrder(orderId);
  if (!accessToken || !tokensMatch(accessToken, order.access_token_hash)) throw new Error("Unauthorized order access.");
  return order;
}

async function getOrder(orderId: string) {
  const db = requireDatabase();
  const { data, error } = await db.from("anti_balcony_orders").select("*").eq("id", orderId).maybeSingle();
  if (error) throw new Error(`Could not load order: ${error.message}`);
  if (!data) throw new Error("Order not found.");
  return data as OrderRow;
}

async function recordOrderEvent(
  orderId: string,
  eventType: string,
  status: string | null,
  source: OrderSource,
  metadata: unknown,
  idempotencyKey?: string,
) {
  const db = requireDatabase();
  const { error } = await db.from("anti_balcony_order_events").insert({
    id: randomUUID(),
    order_id: orderId,
    event_type: eventType,
    status,
    source,
    idempotency_key: idempotencyKey || null,
    metadata: asJson(metadata),
  });
  if (error?.code === "23505") return false;
  if (error) throw new Error(`Could not record order event: ${error.message}`);
  return true;
}

function validateCreateOrderInput(input: CreateOrderInput) {
  if (!/^[0-9a-f-]{36}$/i.test(input.ringId)) throw new Error("A valid Ring ID is required.");
  if (!['snapshot', 'video', 'takeover', 'vip'].includes(input.tier)) throw new Error("Select a valid Times Square package.");
  normalizeEmail(input.email);
  try { new Intl.DateTimeFormat("en", { timeZone: input.timezone }); } catch { throw new Error("A valid IANA timezone is required."); }
  validateOneHourWindow(input.requestedWindowStart, input.requestedWindowEnd, true);
  if (input.alternativeWindowStart || input.alternativeWindowEnd) {
    if (!input.alternativeWindowStart || !input.alternativeWindowEnd) throw new Error("Alternative window requires both start and end.");
    validateOneHourWindow(input.alternativeWindowStart, input.alternativeWindowEnd, true);
  }
  validateCreativeFile({ name: input.creativeFilename, type: input.creativeContentType, size: input.creativeSize });
  validateCreativeSpec({
    contentType: input.creativeContentType,
    width: input.creativeWidth,
    height: input.creativeHeight,
    durationSeconds: input.creativeDurationSeconds,
  });
  if (!input.rightsAccepted || !input.qrPolicyAccepted || !input.captureConsent || !input.termsAccepted || !input.privacyAcknowledged) {
    throw new Error("All required rights, creative, capture, Terms and Privacy acknowledgements must be accepted.");
  }
}

function validateTransition(order: OrderRow, input: TransitionOrderInput, paymentStatus: PaymentStatus) {
  if (input.nextStatus === "booked" && !(input.providerCampaignId || input.providerRef || order.provider_campaign_id || order.provider_ref)) {
    throw new Error("Booked status requires a Blindspot campaign or provider reference.");
  }
  if (input.nextStatus === "scheduled") {
    validateOneHourWindow(
      input.scheduledWindowStart || order.scheduled_window_start || "",
      input.scheduledWindowEnd || order.scheduled_window_end || "",
      false,
    );
  }
  if (input.nextStatus === "played") {
    if (!(input.proofOfPlayRef || order.provider_proof_of_play_ref)) throw new Error("Played status requires Blindspot proof-of-play reference.");
    if (!(input.playedAt || order.played_at) || !isValidDate(input.playedAt || order.played_at || "")) throw new Error("Played status requires exact play timestamp.");
  }
  if (input.nextStatus === "capture_ready" && !(input.capturePath || order.capture_path)) throw new Error("capture_ready requires a private capture path.");
  if (input.nextStatus === "proof_ready" && !(input.deliverableVideoPath || input.deliverableImagePath || order.deliverable_video_path || order.deliverable_image_path)) {
    throw new Error("proof_ready requires at least one private deliverable path.");
  }
  if (input.nextStatus === "failed" && !(input.failureReason || order.failure_reason)) throw new Error("Failed status requires a reason.");
  if (input.nextStatus === "booked" && !["manual_paid", "waived"].includes(paymentStatus)) throw new Error("Booking requires manual payment or waiver.");
}

function validateOneHourWindow(startValue: string, endValue: string, requireFuture: boolean) {
  if (!isValidDate(startValue) || !isValidDate(endValue)) throw new Error("A valid one-hour time window is required.");
  const start = new Date(startValue).getTime();
  const end = new Date(endValue).getTime();
  if (end - start !== 60 * 60 * 1000) throw new Error("Placement request must use a one-hour time window.");
  if (requireFuture && start < Date.now() + 48 * 60 * 60 * 1000) throw new Error("Requested placement must be at least 48 hours from now.");
  if (start > Date.now() + 366 * 24 * 60 * 60 * 1000) throw new Error("Requested placement must be within the next year.");
}

function normalizeEmail(value: string) {
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error("Enter a valid delivery email.");
  return email;
}

function isValidDate(value: string) {
  return Boolean(value) && Number.isFinite(new Date(value).getTime());
}

function validateHttpUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error("Provider asset URL must use HTTPS.");
}

function asJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

function requireDatabase() {
  const db = getSupabaseAdmin();
  if (!db) throw new Error("Supabase order database is not configured.");
  return db;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char] || char);
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
