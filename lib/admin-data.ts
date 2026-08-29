import { getSupabaseAdmin } from "@/lib/supabase";

const TS_PRICE: Record<string, number> = { snapshot: 39900, video: 54900 };

export async function getAdminDashboardData() {
  const db = getSupabaseAdmin();
  const systems = {
    supabase: Boolean(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
    stripe: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
    blindspot: Boolean(process.env.BLINDSPOT_BOOKING_BRIDGE_URL),
    earthcam: Boolean(process.env.EARTHCAM_CAPTURE_BRIDGE_URL || process.env.PROOF_CAPTURE_WEBHOOK_URL),
    email: Boolean(process.env.RESEND_API_KEY),
  };

  if (!db) return { configured: false, systems, orders: [], cards: [], metrics: null };

  const [ordersResult, cardsResult] = await Promise.all([
    db.from("anti_balcony_orders")
      .select("id,order_ref,customer_name,startup_name,email,occasion,tier,event_date,preferred_window_code,alternative_window_code,any_time_same_day,status,payment_status,provider_name,provider_ref,provider_moderation_status,scheduled_window_start,scheduled_window_end,capture_provider,capture_job_id,deliverable_video_path,deliverable_image_path,creative_filename,creative_review_notes,failure_reason,created_at,updated_at")
      .order("created_at", { ascending: false }).limit(150),
    db.from("pop_moment_card_orders")
      .select("id,order_ref,customer_name,email,occasion,card_count,amount_total_cents,payment_status,status,front_path,back_path,curation_notes,customer_feedback,delivered_at,created_at,updated_at")
      .order("created_at", { ascending: false }).limit(150),
  ]);

  const orders = ordersResult.data || [];
  const cards = cardsResult.data || [];
  const paidTimesSquare = orders.filter((o: any) => ["paid", "manual_paid"].includes(o.payment_status));
  const paidCards = cards.filter((o: any) => ["paid", "manual_paid"].includes(o.payment_status));
  const revenueCents = paidTimesSquare.reduce((sum: number, order: any) => sum + (TS_PRICE[order.tier] || 0), 0)
    + paidCards.reduce((sum: number, order: any) => sum + Number(order.amount_total_cents || 0), 0);

  const actionStatuses = new Set(["manual_review", "needs_changes", "failed", "unavailable"]);
  const proofStatuses = new Set(["played", "capture_required", "capture_processing", "capture_ready", "packaging_required", "packaging"]);
  const cardActionStatuses = new Set(["intake_pending", "curation_queue", "curating", "changes_requested", "production"]);

  const metrics = {
    totalOrders: orders.length + cards.length,
    paidOrders: paidTimesSquare.length + paidCards.length,
    revenueCents,
    upcoming: orders.filter((o: any) => o.event_date && !["delivered", "cancelled", "failed"].includes(o.status)).length,
    actionQueue: orders.filter((o: any) => actionStatuses.has(o.status)).length + cards.filter((o: any) => cardActionStatuses.has(o.status)).length,
    proofQueue: orders.filter((o: any) => proofStatuses.has(o.status)).length,
    delivered: orders.filter((o: any) => o.status === "delivered").length + cards.filter((o: any) => o.status === "delivered").length,
  };

  return { configured: true, systems, orders, cards, metrics };
}

export async function getAdminOrder(id: string) {
  const db = getSupabaseAdmin();
  if (!db) return null;
  const [{ data: order }, { data: events }] = await Promise.all([
    db.from("anti_balcony_orders").select("*").eq("id", id).maybeSingle(),
    db.from("anti_balcony_order_events").select("*").eq("order_id", id).order("created_at", { ascending: false }).limit(100),
  ]);
  return order ? { order, events: events || [] } : null;
}

export async function getAdminCardOrder(id: string) {
  const db = getSupabaseAdmin();
  if (!db) return null;
  const [{ data: order }, { data: events }] = await Promise.all([
    db.from("pop_moment_card_orders").select("*").eq("id", id).maybeSingle(),
    db.from("pop_moment_card_order_events").select("*").eq("order_id", id).order("created_at", { ascending: false }).limit(100),
  ]);
  return order ? { order, events: events || [] } : null;
}
