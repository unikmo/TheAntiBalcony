import Link from "next/link";
import type { ReactNode } from "react";

export function SeoShell({ children }: { children: ReactNode }) {
  return (
    <main className="seo-shell">
      <header className="seo-nav">
        <Link href="/">THE ANTI-BALCONY</Link>
        <nav>
          <Link href="/launch">Launch</Link>
          <Link href="/launches">Launches</Link>
          <Link href="/startup-launch">Startup launch</Link>
          <Link href="/guides/how-to-launch-a-startup">Guides</Link>
        </nav>
      </header>
      {children}
    </main>
  );
}

export function SeoCta() {
  return (
    <section className="seo-cta">
      <div>
        <h2>Step out. Ring in your startup.</h2>
        <p>Create a permanent public launch artifact you can share across every launch channel.</p>
      </div>
      <Link href="/launch">CREATE YOUR RING ↗</Link>
    </section>
  );
}
