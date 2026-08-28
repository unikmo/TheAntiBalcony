import { pageMetadata } from "@/lib/discovery";
import Link from "next/link";
import { SeoShell } from "@/components/SeoPage";
import { listRings } from "@/lib/rings";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata("AntiBalcony launch archive", "Earlier public startup launch records from AntiBalcony. For new company and personal celebrations, explore The Pop Moment by UNIKMO.", "/launches");

export default async function LaunchesPage() {
  const rings = await listRings(100);
  return (
    <SeoShell>
      <div className="seo-main">
        <p className="seo-breadcrumb">Public startup launches · Archive</p>
        <h1>The launch archive.</h1>
        <p className="seo-lede">Earlier AntiBalcony Rings remain here. New company and personal celebrations now live in the POP collection.</p>

        {rings.length ? (
          <div className="launch-grid">
            {rings.map((ring) => (
              <a className="launch-card" key={ring.id} href={`/launches/${ring.slug}`}>
                <p className="launch-card-kicker">{ring.category || "PUBLIC RING"}</p>
                <h2>{ring.startupName}</h2>
                <p>{ring.tagline || ring.whatItDoes || "Public startup launch"}</p>
                <div className="ring-meta"><span>{new Date(ring.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span><span>{ring.indexable ? "COMPLETE PROFILE" : "PUBLIC RING"}</span></div>
              </a>
            ))}
          </div>
        ) : (
          <section className="seo-cta">
            <div><h2>No archived launches to display.</h2><p>Explore the new moments wall or start your own celebration.</p></div>
            <Link href="/moments">Explore POP moments</Link>
          </section>
        )}
      </div>
    </SeoShell>
  );
}
