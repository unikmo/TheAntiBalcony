import { randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createCapabilityToken, hashToken } from "@/lib/tokens";
import { validatePopSubmission, validateSourceUrl } from "@/lib/pop-offers";
import type { PopRequestRow, PublicPop } from "@/lib/pop-types";

export class PopError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
const publicFields = "id,title,occasion,moment_date,source_url" as const;
function database() {
  const db = getSupabaseAdmin();
  if (!db) throw new PopError("Moment requests are not available yet. Please contact hello@antibalcony.com.", 503);
  return db;
}
function storageError() { return new PopError("We could not save or load your moment. Please try again later.", 503); }

export async function submitPop(input: Record<string, unknown>) {
  const data = validatePopSubmission(input);
  if (process.env.POP_INTAKE_ENABLED !== "true") throw new PopError("Moment requests are not open yet. Please contact hello@antibalcony.com.", 503);
  const db = database();
  const payloadHash = hashToken(JSON.stringify(data));
  const previous = await db.from("anti_balcony_pop_requests").select("id,payload_hash,subtotal_cents,status").eq("submission_key", data.submissionKey).maybeSingle();
  if (previous.error) throw storageError();
  if (previous.data) {
    if (previous.data.payload_hash !== payloadHash) throw new PopError("This submission reference was already used. Refresh the form.", 409);
    return { reference: previous.data.id, status: previous.data.status, quote: data.quote };
  }
  const now = new Date().toISOString();
  const row: PopRequestRow = {
    id: randomUUID(), submission_key: data.submissionKey, payload_hash: payloadHash, offer: data.offer,
    title: data.title, email: data.email, occasion: data.occasion, celebration: data.celebration,
    moment_date: data.momentDate, source_url: data.sourceUrl, total_cards: data.totalCards,
    subtotal_cents: data.quote.subtotalCents, public_consent: data.publicConsent, feature_consent: data.featureConsent,
    consent_version: "pop-intake-v1", consent_at: now, public_approved: false,
    status: data.offer === "nasdaq" ? "capture_pending" : "submitted",
    final_video_url: null, booking_ref: null, capture_license_ref: null, created_at: now, updated_at: now, review_log: [],
  };
  const result = await db.from("anti_balcony_pop_requests").insert(row);
  if (result.error?.code === "23505") {
    const raced = await db.from("anti_balcony_pop_requests").select("id,payload_hash,status").eq("submission_key", data.submissionKey).maybeSingle();
    if (raced.data?.payload_hash === payloadHash) return { reference: raced.data.id, status: raced.data.status, quote: data.quote };
    throw new PopError("This submission reference was already used. Refresh the form.", 409);
  }
  if (result.error?.message.includes("pop_daily_limit")) throw new PopError("You have reached today’s request limit. Please try tomorrow.", 429);
  if (result.error) throw storageError();
  return { reference: row.id, status: row.status, quote: data.quote };
}

export async function listPublicPops(): Promise<{ moments: PublicPop[]; unavailable: boolean }> {
  const db = getSupabaseAdmin();
  if (!db) return { moments: [], unavailable: true };
  const { data, error } = await db.from("anti_balcony_pop_requests").select(publicFields).eq("offer", "free").eq("public_consent", true).eq("public_approved", true).neq("status", "cancelled").order("created_at", { ascending: false }).limit(60);
  return { moments: data || [], unavailable: Boolean(error) };
}

export async function getPublicPop(id: string): Promise<PublicPop | null> {
  if (!/^[\da-f-]{36}$/i.test(id)) return null;
  const db = getSupabaseAdmin();
  if (!db) return null;
  const { data, error } = await db.from("anti_balcony_pop_requests").select(publicFields).eq("id", id).eq("offer", "free").eq("public_consent", true).eq("public_approved", true).neq("status", "cancelled").maybeSingle();
  if (error) throw storageError();
  return data;
}

// Manual operations only. This does not book a screen, buy a licence, charge, render or send email.
export async function reviewPop(id: string, input: Record<string, unknown>) {
  const db = database();
  const { data: row, error } = await db.from("anti_balcony_pop_requests").select("*").eq("id", id).maybeSingle();
  if (error) throw storageError();
  if (!row) throw new PopError("Request not found.", 404);
  const now = new Date().toISOString();
  const patch: Partial<PopRequestRow> = { updated_at: now, review_log: [...row.review_log, {
    at: now, action: String(input.action), customerApprovalConfirmed: input.customerApprovalConfirmed === true,
    paymentHandled: input.paymentHandled === true, captureVerified: input.captureVerified === true,
    keylessAccessVerified: input.keylessAccessVerified === true,
  }] };
  if (input.action === "publish") {
    if (row.offer !== "free" || !row.public_consent || row.status === "cancelled") throw new PopError("Only consented, active free POPs may be published.", 400);
    if (input.linkReviewed !== true) throw new PopError("Review the public video and permissions before publishing.", 400);
    validateSourceUrl(row.source_url, true);
    patch.public_approved = true;
  } else if (input.action === "unpublish") {
    patch.public_approved = false;
  } else if (input.action === "revoke_card") {
    if (!Number.isInteger(input.ordinal) || Number(input.ordinal) < 1 || Number(input.ordinal) > row.total_cards) throw new PopError("Choose an existing card ordinal.", 400);
    const revoked = await db.from("anti_balcony_pop_cards").update({ enabled: false }).eq("request_id", id).eq("ordinal", Number(input.ordinal));
    if (revoked.error) throw storageError();
  } else if (input.action === "cancel") {
    patch.status = "cancelled"; patch.public_approved = false;
  } else if (input.action === "start_production") {
    if (row.offer === "free" || !["submitted", "capture_pending"].includes(row.status)) throw new PopError("Request cannot enter production.", 400);
    if (input.customerApprovalConfirmed !== true || input.paymentHandled !== true) throw new PopError("Confirm the customer’s scope/quote approval and separately handled payment or waiver.", 400);
    if (row.offer === "nasdaq") {
      if (typeof input.bookingRef !== "string" || !input.bookingRef.trim() || input.bookingRef.length > 500 || typeof input.captureLicenseRef !== "string" || !input.captureLicenseRef.trim() || input.captureLicenseRef.length > 500) throw new PopError("NASDAQ requires a confirmed booking reference and licensed capture reference.", 400);
      patch.booking_ref = input.bookingRef.trim(); patch.capture_license_ref = input.captureLicenseRef.trim();
    }
    patch.status = "in_production";
  } else if (input.action === "complete") {
    if (row.offer === "free" || !["in_production", "ready"].includes(row.status)) throw new PopError("Only a produced paid memory can be completed.", 400);
    if (input.customerApprovalConfirmed !== true) throw new PopError("Customer approval of the final film is required.", 400);
    if (input.keylessAccessVerified !== true) throw new PopError("Test the UNIKMO memory in a signed-out browser and confirm that no login or typed key is required.", 400);
    const finalUrl = validateSourceUrl(input.finalVideoUrl);
    if (!finalUrl || !["unikmo.com", "www.unikmo.com"].includes(new URL(finalUrl).hostname)) throw new PopError("Supply the stable UNIKMO memory page URL, not an expiring storage URL.", 400);
    if (row.offer === "nasdaq" && (!row.capture_license_ref || input.captureVerified !== true)) throw new PopError("Verify that licensed footage shows the complete placement before delivery.", 400);
    // Stable, individual QR targets, all pointing to one approved memory. Retry-safe per ordinal.
    const cards = Array.from({ length: row.total_cards }, (_, index) => ({ token: createCapabilityToken(), request_id: id, ordinal: index + 1, enabled: true }));
    const inserted = await db.from("anti_balcony_pop_cards").upsert(cards, { onConflict: "request_id,ordinal", ignoreDuplicates: true });
    if (inserted.error) throw storageError();
    patch.status = "ready"; patch.final_video_url = finalUrl;
  } else throw new PopError("Unsupported review action.", 400);
  const updated = await db.from("anti_balcony_pop_requests").update(patch).eq("id", id).eq("status", row.status).select("id,status,public_approved").maybeSingle();
  if (updated.error) throw storageError();
  if (!updated.data) throw new PopError("Request changed during review. Reload before retrying.", 409);
  return updated.data;
}

export async function getCardMemory(token: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const db = getSupabaseAdmin();
  if (!db) return null;
  const card = await db.from("anti_balcony_pop_cards").select("request_id").eq("token", token).eq("enabled", true).maybeSingle();
  if (!card.data) return null;
  const memory = await db.from("anti_balcony_pop_requests").select("title,final_video_url").eq("id", card.data.request_id).eq("status", "ready").maybeSingle();
  return memory.data;
}

export async function listPopOperations() {
  const { data, error } = await database().from("anti_balcony_pop_requests").select("id,offer,title,email,occasion,celebration,moment_date,source_url,total_cards,subtotal_cents,feature_consent,public_approved,status,created_at").order("created_at", { ascending: false }).limit(100);
  if (error) throw storageError();
  return data;
}

export async function listPopCards(id: string) {
  const { data, error } = await database().from("anti_balcony_pop_cards").select("token,ordinal,enabled").eq("request_id", id).order("ordinal");
  if (error) throw storageError();
  return data;
}
