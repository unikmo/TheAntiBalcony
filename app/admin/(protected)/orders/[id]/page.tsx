import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminOrder } from "@/lib/admin-data";

type TimesSquareOrder = {
  id: string;
  order_ref: string;
  customer_name: string | null;
  startup_name: string | null;
  email: string;
  occasion: string | null;
  tier: string;
  event_date: string | null;
  preferred_window_code: string;
  alternative_window_code: string | null;
  any_time_same_day: boolean;
  status: string;
  payment_status: string;
  provider_name: string | null;
  provider_ref: string | null;
  provider_campaign_id?: string | null;
  provider_moderation_status: string | null;
  provider_proof_of_play_ref?: string | null;
  scheduled_window_start: string | null;
  scheduled_window_end: string | null;
  capture_provider: string | null;
  capture_job_id: string | null;
  deliverable_video_path: string | null;
  deliverable_image_path: string | null;
  creative_filename: string | null;
  creative_width?: number | null;
  creative_height?: number | null;
  creative_duration_seconds?: number | null;
  creative_message?: string | null;
  creative_review_notes: string | null;
  failure_reason: string | null;
  delivered_at?: string | null;
  stripe_session_id?: string;
  created_at: string;
  updated_at: string;
};

type OrderEvent = {
  id: string;
  order_id: string;
  event_type: string;
  source: string;
  status: string;
  created_at: string;
};

const STATUSES = ["creative_upload_pending","availability_check","available","unavailable","manual_review","inventory_held","creative_review","needs_changes","payment_pending","paid","booking","booked","scheduled","played","capture_required","capture_processing","capture_ready","packaging_required","packaging","proof_ready","delivered","cancelled","failed"];
function label(value: string | null | undefined): string { return String(value || "—").replaceAll("_", " "); }

export default async function AdminOrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ updated?: string }> }) {
  const { id } = await params;
  const { updated } = await searchParams;
  const data = await getAdminOrder(id);
  if (!data) notFound();
  const o = data.order as TimesSquareOrder;
  const events = data.events as OrderEvent[];
  return <>
    <div className="admin-breadcrumb"><Link href="/admin">← Overview</Link><span>{o.order_ref}</span></div>
    <header className="admin-order-head"><div><p>TIMES SQUARE ORDER</p><h1>{o.customer_name || o.startup_name}</h1><span>{o.email} · {o.occasion || label(o.tier)}</span></div><div><b className="admin-pill">{label(o.status)}</b><b className="admin-pill">{label(o.payment_status)}</b></div></header>
    {updated ? <div className="admin-success">Order updated.</div> : null}
    <section className="admin-order-grid">
      <article className="admin-panel"><div className="admin-panel-head"><div><p>BOOKING</p><h2>Promise</h2></div></div><dl className="admin-dl"><div><dt>Date</dt><dd>{o.event_date || "—"}</dd></div><div><dt>Preferred window</dt><dd>{o.preferred_window_code || "—"}</dd></div><div><dt>Backup window</dt><dd>{o.alternative_window_code || "—"}</dd></div><div><dt>Any time same day</dt><dd>{o.any_time_same_day ? "Yes" : "No"}</dd></div><div><dt>Package</dt><dd>{o.tier === "video" ? "$549 · Show + Keep" : "$399 · Show It"}</dd></div><div><dt>Stripe session</dt><dd>{o.stripe_session_id || "—"}</dd></div></dl></article>
      <article className="admin-panel"><div className="admin-panel-head"><div><p>PROVIDER</p><h2>Placement</h2></div></div><dl className="admin-dl"><div><dt>Provider</dt><dd>{o.provider_name || "blindspot"}</dd></div><div><dt>Provider ref</dt><dd>{o.provider_ref || "—"}</dd></div><div><dt>Campaign</dt><dd>{o.provider_campaign_id || "—"}</dd></div><div><dt>Moderation</dt><dd>{o.provider_moderation_status || "—"}</dd></div><div><dt>Scheduled</dt><dd>{o.scheduled_window_start ? `${o.scheduled_window_start} → ${o.scheduled_window_end || ""}` : "—"}</dd></div><div><dt>Proof of play</dt><dd>{o.provider_proof_of_play_ref || "—"}</dd></div></dl></article>
      <article className="admin-panel"><div className="admin-panel-head"><div><p>CREATIVE</p><h2>Input</h2></div></div><dl className="admin-dl"><div><dt>File</dt><dd>{o.creative_filename || "—"}</dd></div><div><dt>Dimensions</dt><dd>{o.creative_width && o.creative_height ? `${o.creative_width} × ${o.creative_height}` : "—"}</dd></div><div><dt>Duration</dt><dd>{o.creative_duration_seconds ? `${o.creative_duration_seconds}s` : "—"}</dd></div><div><dt>Message</dt><dd>{o.creative_message || "—"}</dd></div></dl></article>
      <article className="admin-panel"><div className="admin-panel-head"><div><p>PROOF</p><h2>Capture + delivery</h2></div></div><dl className="admin-dl"><div><dt>Capture provider</dt><dd>{o.capture_provider || "—"}</dd></div><div><dt>Capture job</dt><dd>{o.capture_job_id || "—"}</dd></div><div><dt>Image</dt><dd>{o.deliverable_image_path || "—"}</dd></div><div><dt>Video</dt><dd>{o.deliverable_video_path || "—"}</dd></div><div><dt>Delivered</dt><dd>{o.delivered_at || "—"}</dd></div></dl></article>
    </section>
    <section className="admin-panel admin-edit"><div className="admin-panel-head"><div><p>OPERATIONS</p><h2>Update order</h2></div></div><form method="post" action={`/api/admin/orders/${o.id}`}><div className="admin-form-grid"><label>Status<select name="status" defaultValue={o.status}>{STATUSES.map(s => <option key={s} value={s}>{label(s)}</option>)}</select></label><label>Provider ref<input name="provider_ref" defaultValue={o.provider_ref || ""}/></label><label>Provider campaign<input name="provider_campaign_id" defaultValue={o.provider_campaign_id || ""}/></label><label>Moderation status<input name="provider_moderation_status" defaultValue={o.provider_moderation_status || ""}/></label><label>Scheduled start<input name="scheduled_window_start" defaultValue={o.scheduled_window_start || ""}/></label><label>Scheduled end<input name="scheduled_window_end" defaultValue={o.scheduled_window_end || ""}/></label><label>Proof of play ref<input name="provider_proof_of_play_ref" defaultValue={o.provider_proof_of_play_ref || ""}/></label><label>Capture provider<input name="capture_provider" defaultValue={o.capture_provider || ""}/></label><label>Capture job<input name="capture_job_id" defaultValue={o.capture_job_id || ""}/></label><label>Deliverable image<input name="deliverable_image_path" defaultValue={o.deliverable_image_path || ""}/></label><label>Deliverable video<input name="deliverable_video_path" defaultValue={o.deliverable_video_path || ""}/></label><label className="admin-span-2">Creative review notes<textarea name="creative_review_notes" defaultValue={o.creative_review_notes || ""}/></label><label className="admin-span-2">Failure / exception note<textarea name="failure_reason" defaultValue={o.failure_reason || ""}/></label></div><div className="admin-form-actions"><button type="submit">Save operational update</button>{o.payment_status === "not_requested" || o.payment_status === "pending" ? <><button name="payment_action" value="manual_paid" type="submit" className="is-secondary">Mark manual paid</button><button name="payment_action" value="waived" type="submit" className="is-secondary">Waive payment</button></> : null}</div></form></section>
    <section className="admin-panel"><div className="admin-panel-head"><div><p>AUDIT TRAIL</p><h2>Order events</h2></div><span>{events.length}</span></div><div className="admin-events">{events.map((e) => <article key={e.id}><time>{new Date(e.created_at).toLocaleString("en-GB")}</time><strong>{label(e.event_type)}</strong><span>{e.source} · {label(e.status)}</span></article>)}</div></section>
  </>;
}
