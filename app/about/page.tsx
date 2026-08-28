import Link from "next/link";
import { PopShell } from "@/components/PopShell";
import { StructuredData } from "@/components/StructuredData";
import { pageMetadata, SITE_DESCRIPTION, webpageSchema } from "@/lib/discovery";

export const metadata = pageMetadata("About The Pop Moment by UNIKMO", SITE_DESCRIPTION, "/about");

export default function About() {
  return <PopShell><StructuredData data={webpageSchema("/about", "About The Pop Moment by UNIKMO", SITE_DESCRIPTION, "AboutPage")} />
    <article className="pop-wrap pop-page"><p className="pop-eyebrow">An AntiBalcony experience · by UNIKMO</p><h1>The moment.<br /><em>And what remains.</em></h1>
      <p className="pop-intro">{SITE_DESCRIPTION}</p>
      <div className="pop-guide">
        <section><h2>What we do</h2><p>You choose the celebration: confetti, a cork pop, balloons, streamers, a team cheer or your own idea. We provide creative direction and capture instructions. For paid experiences, we curate your supplied footage into a 30–45 second memory film.</p></section>
        <section><h2>Where UNIKMO fits</h2><p>The physical UNIKMO card links to that film. Same-memory cards let a team, family or group of guests keep the same celebration. Each card has its own QR link; no typed key is required. Anyone with the link can watch.</p><p><a href="https://www.unikmo.com/">Explore UNIKMO ↗</a></p></section>
        <section><h2>Public is optional</h2><p>Free POP submissions link to an existing social video after review; we do not host or archive that video. Keep it does not require a public gallery listing. The NASDAQ experience is request-only until availability, creative approval and licensed capture are confirmed. Illustrative screen footage is not completed customer proof.</p></section>
        <section><h2>What changed from AntiBalcony?</h2><p>AntiBalcony began with founder launch records called Rings. The Pop Moment expands the experience to both companies and individuals, without prescribing a bell or shipping celebration props. Earlier <Link href="/launches">launch records</Link> and <Link href="/guides">guides</Link> remain accessible; old billboard and takeover packages are not offered for new orders.</p></section>
      </div>
      <p><Link href="/#packages">See the collection and current prices ↗</Link></p>
      <p className="pop-note">No guaranteed audience, search ranking or social feature. For confidential films, agree an appropriate access arrangement before ordering. Operator and contact details are on the <Link href="/imprint">imprint</Link>.</p>
    </article>
  </PopShell>;
}
