import Link from "next/link";
import type { ReactNode } from "react";

export function SeoShell({ children }: { children: ReactNode }) {
  return (
    <main className="seo-shell">
      <header className="seo-nav">
        <div className="seo-nav-inner">
          <Link className="seo-brand" href="/" aria-label="The Anti-Balcony home">
            <span className="seo-brand-mark" aria-hidden="true" />
            THE ANTI-BALCONY
          </Link>
          <nav aria-label="Primary navigation">
            <Link href="/launches">Launches</Link>
            <Link href="/startup-launch">How it works</Link>
            <Link href="/#packages">Packages</Link>
            <Link href="/guides/how-to-launch-a-startup">Guides</Link>
          </nav>
          <Link className="seo-nav-cta" href="/launch">Create your Ring</Link>
        </div>
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
      <Link href="/launch">Create your Ring</Link>
    </section>
  );
}
