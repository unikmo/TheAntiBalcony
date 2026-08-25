import Link from "next/link";
import type { ReactNode } from "react";

export function LegalShell({ children }: { children: ReactNode }) {
  return <main className="seo-shell"><header className="seo-nav"><div className="seo-nav-inner"><Link className="seo-brand" href="/"><span className="seo-brand-mark" aria-hidden="true" />THE ANTI-BALCONY</Link><nav><Link href="/launches">Launches</Link><Link href="/startup-launch">How it works</Link></nav><Link className="seo-nav-cta" href="/launch">Create your Ring</Link></div></header><article className="legal-page">{children}</article><footer className="legal-footer"><div><strong>THE ANTI-BALCONY</strong><span>A service of PlanetHike OÜ</span></div><nav><Link href="/imprint">Imprint</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><a href="mailto:hello@antibalcony.com">Contact</a></nav><span>© {new Date().getFullYear()} PlanetHike OÜ</span></footer></main>;
}
