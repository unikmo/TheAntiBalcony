import type { Metadata } from "next";
import { SeoShell } from "@/components/SeoPage";
import { listRings } from "@/lib/rings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Public Startup Launches",
  description: "Browse public startup launches and shareable Rings created on The Anti-Balcony.",
  alternates: { canonical: "/launches" },
};

export default async function LaunchesPage() {
  const rings = await listRings(100);
  return (
    <SeoShell>
      <div className="seo-main">
        <p className="seo-breadcrumb">PUBLIC STARTUP LAUNCHES</p>
        <h1>Explore launches.</h1>
        <p className="seo-lede">Every Ring marks a startup launch in public. Complete profiles can become indexable launch pages; incomplete profiles stay out of search until they contain enough useful information.</p>

        {rings.length ? (
          <div className="launch-grid">
            {rings.map((ring) => (
              <a className="launch-card" key={ring.id} href={`/launches/${ring.slug}`}>
                <p className="ab2-kicker">{ring.category || "PUBLIC RING"}</p>
                <h2>{ring.startupName}</h2>
                <p>{ring.tagline || ring.whatItDoes || "Public startup launch"}</p>
                <div className="ring-meta"><span>{new Date(ring.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span><span>{ring.indexable ? "COMPLETE PROFILE" : "PUBLIC RING"}</span></div>
              </a>
            ))}
          </div>
        ) : (
          <section className="seo-cta">
            <div><h2>The first public launch is still open.</h2><p>No fabricated inventory. Create the Ring and become the record.</p></div>
            <a href="/launch">RING IN YOUR STARTUP ↗</a>
          </section>
        )}
      </div>
    </SeoShell>
  );
}
