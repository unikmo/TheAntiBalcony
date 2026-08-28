import Link from "next/link";
import type { ReactNode } from "react";
import "@/app/pop.css";

export function PopShell({ children }: { children: ReactNode }) {
  return <div className="pop-site">
    <a className="pop-skip" href="#pop-main">Skip to content</a>
    <header className="pop-nav">
      <Link className="pop-brand" href="/">the pop moment<span>by UNIKMO</span></Link>
      <nav aria-label="Primary navigation"><Link href="/#experience">The experience</Link><Link href="/#packages">The collection</Link><Link href="/moments">Moments</Link></nav>
      <Link className="pop-button pop-button-small" href="/launch">Your moment ↗</Link>
    </header>
    <main id="pop-main">{children}</main>
    <footer className="pop-footer"><div><Link className="pop-brand" href="/">the pop moment<span>An AntiBalcony experience · by UNIKMO</span></Link></div>
      <nav aria-label="Footer navigation"><Link href="/about">About</Link><Link href="/capture-guide">Capture guide</Link><Link href="/guides">Guides</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/imprint">Imprint</Link><a href="mailto:hello@antibalcony.com">Contact</a></nav>
    </footer>
  </div>;
}
