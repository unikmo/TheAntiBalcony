import Link from "next/link";
import { pageMetadata, webpageSchema } from "@/lib/discovery";
import { StructuredData } from "@/components/StructuredData";
import { SeoCta, SeoShell } from "@/components/SeoPage";

const description = "Celebrate a startup launch with a customer-filmed POP, a curated milestone film and UNIKMO memory cards. Earlier AntiBalcony Rings remain in the launch archive.";
export const metadata = pageMetadata("Startup launch celebrations", description, "/startup-launch");

export default function StartupLaunchPage() {
  return (
    <SeoShell>
      <StructuredData data={webpageSchema("/startup-launch", "Startup launch celebrations", description)} />
      <div className="seo-main">
        <p className="seo-breadcrumb">COMPANY MILESTONES</p>
        <h1>A launch moment, not a launch competition.</h1>
        <p className="seo-lede">The Pop Moment by UNIKMO helps teams celebrate a launch and keep the memory. You choose the POP, film it with our guidance and decide whether to share it or commission a curated film.</p>

        <div className="seo-content">
          <section className="seo-section">
            <h2>Start with your team’s POP</h2>
            <div><p>Confetti, a cork pop or a team cheer: choose a celebration that belongs to your team. Capture anticipation, the burst and the reactions using the <Link href="/capture-guide">free filming guide</Link>. Arrange your own props and filming.</p></div>
          </section>
          <section className="seo-section">
            <h2>Where it fits</h2>
            <div><p>A celebration film complements your product launch; it is not a replacement for customer acquisition, product demonstrations or an owned product page. Free POP submissions link to your existing public social video after review. Social features and audience reach are not guaranteed.</p></div>
          </section>
          <section className="seo-section">
            <h2>Keep the memory together</h2>
            <div><p>Keep it includes a curated 30–45 second film from your footage, one revision and one physical UNIKMO card. Additional same-memory cards can share the film with your team. See the <Link href="/#packages">current collection and prices</Link>.</p></div>
          </section>
          <section className="seo-section">
            <h2>Times Square is optional</h2>
            <div><p>The NASDAQ experience is request-only. Screen availability, creative approval, licensed capture and the final quote must be confirmed before payment or booking. We do not promise a placement from an enquiry or use a play log as a substitute for the agreed video.</p><p>Earlier AntiBalcony <Link href="/launches">Rings remain in the archive</Link>. New Ring orders, generic billboard packages and staffed takeovers are retired.</p></div>
          </section>
        </div>
        <SeoCta />
      </div>
    </SeoShell>
  );
}
