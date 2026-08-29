import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

const ALLOWED = new Set(["intake_pending","curation_queue","curating","proof_ready","changes_requested","approved","production","delivered","cancelled","failed"]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession())) return NextResponse.redirect(new URL("/admin/login", request.url), 303);
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const { id } = await context.params;
  const form = await request.formData();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const status = String(form.get("status") || "");
  if (ALLOWED.has(status)) update.status = status;
  for (const key of ["front_path","back_path","curation_notes","customer_feedback"] as const) {
    if (form.has(key)) update[key] = String(form.get(key) || "").trim() || null;
  }
  if (status === "delivered") update.delivered_at = new Date().toISOString();
  if (form.get("payment_action") === "manual_paid") update.payment_status = "manual_paid";
  if (form.get("payment_action") === "waived") update.payment_status = "waived";

  const { error } = await db.from("pop_moment_card_orders").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await db.from("pop_moment_card_order_events").insert({ order_id: id, event_type: "admin_update", status: typeof update.status === "string" ? update.status : null, source: "admin", metadata: update });
  return NextResponse.redirect(new URL(`/admin/cards/${id}?updated=1`, request.url), 303);
}
