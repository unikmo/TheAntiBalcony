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
      <footer className="legal-footer">
        <div><strong>THE ANTI-BALCONY</strong><span>A service of PlanetHike OÜ</span></div>
        <nav aria-label="Legal navigation"><Link href="/imprint">Imprint</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><a href="mailto:hello@antibalcony.com">Contact</a></nav>
        <span>© {new Date().getFullYear()} PlanetHike OÜ</span>
      </footer>
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
