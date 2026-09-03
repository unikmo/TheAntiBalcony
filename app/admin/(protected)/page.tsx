import Link from "next/link";
import { getAdminDashboardData } from "@/lib/admin-data";

function money(cents: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100); }
function label(value: string | null | undefined) { return (value || "—").replaceAll("_", " "); }

export default async function AdminDashboard() {
  const data = await getAdminDashboardData();
  if (!data.configured || !data.metrics) return <section className="admin-empty"><h1>Database connection required</h1><p>The dashboard is protected correctly, but Supabase runtime credentials are not available to this deployment.</p></section>;
  const m = data.metrics;
  const actionOrders = data.orders.filter((o) => ["manual_review","needs_changes","failed","unavailable"].includes(o.status));
  const upcoming = data.orders.filter((o) => o.event_date && !["delivered","cancelled","failed"].includes(o.status)).sort((a,b) => String(a.event_date).localeCompare(String(b.event_date))).slice(0,12);
  const proofQueue = data.orders.filter((o) => ["played","capture_required","capture_processing","capture_ready","packaging_required","packaging"].includes(o.status));
  const cardQueue = data.cards.filter((o) => !["delivered","cancelled","failed"].includes(o.status));
  return (
    <>
      <header className="admin-top"><div><p>BUSINESS CONTROL</p><h1>Good morning.</h1><span>Everything that needs attention across The Pop Moment.</span></div><a href="/" target="_blank" rel="noreferrer">Open website ↗</a></header>
      <section className="admin-kpis">
        <article><span>Total orders</span><strong>{m.totalOrders}</strong></article>
        <article><span>Paid orders</span><strong>{m.paidOrders}</strong></article>
        <article><span>Booked revenue</span><strong>{money(m.revenueCents)}</strong></article>
        <article className={m.actionQueue ? "is-alert" : ""}><span>Needs attention</span><strong>{m.actionQueue}</strong></article>
        <article><span>Proof queue</span><strong>{m.proofQueue}</strong></article>
        <article><span>Delivered</span><strong>{m.delivered}</strong></article>
      </section>

      <section className="admin-grid-two">
        <article className="admin-panel">
          <div className="admin-panel-head"><div><p>ACTION QUEUE</p><h2>Needs a human</h2></div><span>{actionOrders.length}</span></div>
          {actionOrders.length ? <div className="admin-list">{actionOrders.slice(0,10).map((o)=><Link key={o.id} href={`/admin/orders/${o.id}`}><div><strong>{o.order_ref}</strong><span>{o.customer_name || o.startup_name} · {o.occasion || label(o.tier)}</span></div><b>{label(o.status)}</b></Link>)}</div> : <p className="admin-muted">No Times Square exceptions right now.</p>}
        </article>
        <article className="admin-panel" id="systems">
          <div className="admin-panel-head"><div><p>SYSTEMS</p><h2>Automation readiness</h2></div></div>
          <div className="admin-systems">{Object.entries(data.systems).map(([name, ok]) => <div key={name}><span className={ok ? "is-ok" : "is-off"} /> <strong>{name}</strong><b>{ok ? "Ready" : "Not configured"}</b></div>)}</div>
        </article>
      </section>

      <section className="admin-panel" id="times-square">
        <div className="admin-panel-head"><div><p>TIMES SQUARE</p><h2>Upcoming displays</h2></div><span>{m.upcoming}</span></div>
        <div className="admin-table"><div className="admin-tr admin-th"><span>Order</span><span>Date</span><span>Window</span><span>Customer</span><span>Package</span><span>Status</span></div>{upcoming.map((o) => <Link className="admin-tr" key={o.id} href={`/admin/orders/${o.id}`}><span><strong>{o.order_ref}</strong></span><span>{o.event_date}</span><span>{o.preferred_window_code || "—"}</span><span>{o.customer_name || o.startup_name}</span><span>{o.tier === "video" ? "$549 · Show + Keep" : "$399 · Show It"}</span><span><b className="admin-pill">{label(o.status)}</b></span></Link>)}</div>
      </section>

      <section className="admin-grid-two">
        <article className="admin-panel">
          <div className="admin-panel-head"><div><p>PROOF + DELIVERY</p><h2>After the screen</h2></div><span>{proofQueue.length}</span></div>
          <div className="admin-list">{proofQueue.slice(0,10).map((o) => <Link key={o.id} href={`/admin/orders/${o.id}`}><div><strong>{o.order_ref}</strong><span>{o.event_date} · {o.capture_provider || "capture pending"}</span></div><b>{label(o.status)}</b></Link>)}</div>
        </article>
        <article className="admin-panel" id="cards">
          <div className="admin-panel-head"><div><p>UNIKMO CURATION</p><h2>Card queue</h2></div><span>{cardQueue.length}</span></div>
          {cardQueue.length ? <div className="admin-list">{cardQueue.slice(0,10).map((o) => <Link key={o.id} href={`/admin/cards/${o.id}`}><div><strong>{o.order_ref}</strong><span>{o.customer_name} · {o.card_count} card{o.card_count === 1 ? "" : "s"} · {money(Number(o.amount_total_cents))}</span></div><b>{label(o.status)}</b></Link>)}</div> : <p className="admin-muted">No curated-card orders yet.</p>}
        </article>
      </section>
    </>
  );
}
