import Link from "next/link";
import { SeoShell } from "@/components/SeoPage";
import { StructuredData } from "@/components/StructuredData";
import { pageMetadata, webpageSchema } from "@/lib/discovery";
import { GUIDES } from "@/lib/seo-content";

const description = "Explore the POP capture guide and retained AntiBalcony startup-launch resources. Current celebration experiences are offered by The Pop Moment by UNIKMO.";
export const metadata = pageMetadata("Capture and launch guides", description, "/guides");
export default function GuidesPage() {
  return <SeoShell><StructuredData data={webpageSchema("/guides", "Capture and launch guides", description, "CollectionPage")} /><section className="seo-main">
    <h1>Make the moment count.</h1><p className="seo-lede">Start with <Link href="/capture-guide">the POP capture guide</Link> for your celebration. These retained startup-launch guides provide context for company milestones, not promises of reach or current Ring sales.</p>
    <div className="seo-content">{GUIDES.map(guide => <article className="seo-section" key={guide.slug}><h2><Link href={`/guides/${guide.slug}`}>{guide.title}</Link></h2><p>{guide.description}</p></article>)}</div>
  </section></SeoShell>;
}
