import Link from "next/link";
import type { ReactNode } from "react";
import { PopShell } from "./PopShell";
export function SeoShell({ children }: { children: ReactNode }) {
  return <PopShell><div className="seo-shell"><p className="pop-wrap pop-note">AntiBalcony archive. For new celebrations, explore <Link href="/#packages">the POP collection</Link>.</p>{children}</div></PopShell>;
}
export function SeoCta() {
  return <section className="seo-cta"><div><h2>Celebrate it. Show it. Keep it.</h2><p>Make your milestone a POP moment.</p></div><Link href="/launch">Start your moment</Link></section>;
}
