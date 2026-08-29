import type { Metadata } from "next";
import { adminAuthConfigured } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Admin Login | The Pop Moment", robots: { index: false, follow: false } };

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const configured = adminAuthConfigured();
  return (
    <main className="admin-login-shell">
      <section className="admin-login-card">
        <a className="admin-wordmark" href="/">THE <em>POP</em> MOMENT</a>
        <p className="admin-eyebrow">OPERATIONS</p>
        <h1>Admin dashboard</h1>
        <p>Orders, payments, screens, curation, proof and delivery in one place.</p>
        {!configured ? <div className="admin-alert">Set <code>ADMIN_DASHBOARD_PASSWORD</code> in Vercel before admin access can be used.</div> : null}
        {error === "invalid" ? <div className="admin-alert">Incorrect password.</div> : null}
        <form method="post" action="/api/admin/login">
          <label>Password<input name="password" type="password" autoComplete="current-password" required disabled={!configured} /></label>
          <button type="submit" disabled={!configured}>Open dashboard</button>
        </form>
      </section>
    </main>
  );
}
