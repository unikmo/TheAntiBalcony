import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminCardOrder } from "@/lib/admin-data";

type CardOrder = {
  id: string;
  order_ref: string;
  customer_name: string;
  email: string;
  occasion: string;
  card_count: number;
  amount_total_cents: number;
  payment_status: string;
  status: string;
  front_path: string | null;
  back_path: string | null;
  curation_notes: string | null;
  customer_feedback: string | null;
  delivered_at: string | null;
  stripe_session_id?: string;
  message?: string;
  created_at: string;
  updated_at: string;
};

type CardEvent = {
  id: string;
  order_id: string;
  event_type: string;
  source: string;
  status: string;
  created_at: string;
};

const STATUSES = ["intake_pending","curation_queue","curating","proof_ready","changes_requested","approved","production","delivered","cancelled","failed"];
function label(value: string | null | undefined): string { return String(value || "—").replaceAll("_", " "); }
function money(cents: number): string { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100); }

export default async function AdminCardPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ updated?: string }> }) {
  const { id } = await params;
  const { updated } = await searchParams;
  const data = await getAdminCardOrder(id);
  if (!data) notFound();
  const o = data.order as CardOrder;
  const events = data.events as CardEvent[];
  return <>
    <div className="admin-breadcrumb"><Link href="/admin#cards">← Card queue</Link><span>{o.order_ref}</span></div>
    <header className="admin-order-head"><div><p>UNIKMO CURATION</p><h1>{o.customer_name}</h1><span>{o.email} · {o.occasion || "Moment"}</span></div><div><b className="admin-pill">{label(o.status)}</b><b className="admin-pill">{label(o.payment_status)}</b></div></header>
    {updated ? <div className="admin-success">Card order updated.</div> : null}
    <section className="admin-order-grid"><article className="admin-panel"><div className="admin-panel-head"><div><p>ORDER</p><h2>Commercial</h2></div></div><dl className="admin-dl"><div><dt>Cards</dt><dd>{o.card_count}</dd></div><div><dt>Price</dt><dd>{money(Number(o.amount_total_cents))}</dd></div><div><dt>Rule</dt><dd>$199 first · +$12 each additional</dd></div><div><dt>Stripe session</dt><dd>{o.stripe_session_id || "—"}</dd></div></dl></article><article className="admin-panel"><div className="admin-panel-head"><div><p>CURATION</p><h2>Creative</h2></div></div><dl className="admin-dl"><div><dt>Message</dt><dd>{o.message || "—"}</dd></div><div><dt>Front</dt><dd>{o.front_path || "—"}</dd></div><div><dt>Back</dt><dd>{o.back_path || "—"}</dd></div><div><dt>Delivered</dt><dd>{o.delivered_at || "—"}</dd></div></dl></article></section>
    <section className="admin-panel admin-edit"><div className="admin-panel-head"><div><p>OPERATIONS</p><h2>Manage curation</h2></div></div><form method="post" action={`/api/admin/cards/${o.id}`}><div className="admin-form-grid"><label>Status<select name="status" defaultValue={o.status}>{STATUSES.map(s => <option key={s} value={s}>{label(s)}</option>)}</select></label><label>Front asset<input name="front_path" defaultValue={o.front_path || ""} /></label><label>Back asset<input name="back_path" defaultValue={o.back_path || ""} /></label><label className="admin-span-2">Curation notes<textarea name="curation_notes" defaultValue={o.curation_notes || ""} /></label><label className="admin-span-2">Customer feedback<textarea name="customer_feedback" defaultValue={o.customer_feedback || ""} /></label></div><div className="admin-form-actions"><button type="submit">Save curation update</button>{o.payment_status === "not_requested" || o.payment_status === "pending" ? <><button name="payment_action" value="manual_paid" type="submit" className="is-secondary">Mark manual paid</button><button name="payment_action" value="waived" type="submit" className="is-secondary">Waive payment</button></> : null}</div></form></section>
    <section className="admin-panel"><div className="admin-panel-head"><div><p>AUDIT TRAIL</p><h2>Card events</h2></div><span>{events.length}</span></div><div className="admin-events">{events.map((e) => <article key={e.id}><time>{new Date(e.created_at).toLocaleString("en-GB")}</time><strong>{label(e.event_type)}</strong><span>{e.source} · {label(e.status)}</span></article>)}</div></section>
  </>;
}
