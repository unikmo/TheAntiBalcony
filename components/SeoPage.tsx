import type { ReactNode } from "react";

export function SeoShell({ children }: { children: ReactNode }) {
  return (
    <main className="seo-shell">
      <header className="seo-nav">
        <a href="/">THE ANTI-BALCONY</a>
        <nav>
          <a href="/launch">Launch</a>
          <a href="/launches">Launches</a>
          <a href="/startup-launch">Startup launch</a>
          <a href="/guides/how-to-launch-a-startup">Guides</a>
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
      <a href="/launch">CREATE YOUR RING ↗</a>
    </section>
  );
}
