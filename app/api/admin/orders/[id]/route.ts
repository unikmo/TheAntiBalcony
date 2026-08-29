import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

const ALLOWED_STATUSES = new Set(["creative_upload_pending","availability_check","available","unavailable","manual_review","inventory_held","creative_review","needs_changes","payment_pending","paid","booking","booked","scheduled","played","capture_required","capture_processing","capture_ready","packaging_required","packaging","proof_ready","delivered","cancelled","failed"]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession())) return NextResponse.redirect(new URL("/admin/login", request.url), 303);
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const { id } = await context.params;
  const form = await request.formData();
  const status = String(form.get("status") || "");
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (ALLOWED_STATUSES.has(status)) update.status = status;
  for (const key of ["creative_review_notes","provider_ref","provider_campaign_id","provider_moderation_status","provider_proof_of_play_ref","scheduled_window_start","scheduled_window_end","capture_provider","capture_job_id","deliverable_video_path","deliverable_image_path","failure_reason"] as const) {
    if (form.has(key)) update[key] = String(form.get(key) || "").trim() || null;
  }
  if (form.get("payment_action") === "manual_paid") update.payment_status = "manual_paid";
  if (form.get("payment_action") === "waived") update.payment_status = "waived";

  const { error } = await db.from("anti_balcony_orders").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await db.from("anti_balcony_order_events").insert({
    id: randomUUID(), order_id: id, event_type: "admin_update", status: typeof update.status === "string" ? update.status : null,
    source: "operations", metadata: update, idempotency_key: `${id}:admin:${Date.now()}`,
  });
  return NextResponse.redirect(new URL(`/admin/orders/${id}?updated=1`, request.url), 303);
}
