import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Operations | The Pop Moment", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasAdminSession())) redirect("/admin/login");
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-wordmark">THE <em>POP</em> MOMENT</Link>
        <span className="admin-sidebar-label">OPERATIONS</span>
        <nav>
          <Link href="/admin">Overview</Link>
          <Link href="/admin#times-square">Times Square</Link>
          <Link href="/admin#cards">UNIKMO cards</Link>
          <Link href="/admin#systems">Systems</Link>
        </nav>
        <form method="post" action="/api/admin/logout"><button type="submit">Sign out</button></form>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
