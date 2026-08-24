import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoShell } from "@/components/SeoPage";
import { getRingBySlug } from "@/lib/rings";
import { escapeHtmlAttribute, safeJsonLd } from "@/lib/security";

export const dynamic = "force-dynamic";

function isSearchReady(ring: Awaited<ReturnType<typeof getRingBySlug>>) {
  return Boolean(ring?.indexable && ring.socialUrl);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const ring = await getRingBySlug(slug);
  if (!ring) return {};

  const description = ring.whatItDoes || ring.tagline || `${ring.startupName} launched in public on The Anti-Balcony.`;
  const searchReady = isSearchReady(ring);
  return {
    title: `${ring.startupName} Startup Launch`,
    description,
    alternates: { canonical: `/launches/${ring.slug}` },
    robots: searchReady ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title: `${ring.startupName} launched in public`,
      description,
      type: "article",
      images: ring.imageUrl ? [ring.imageUrl] : undefined,
    },
  };
}

export default async function RingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ring = await getRingBySlug(slug);
  if (!ring) notFound();

  const searchReady = isSearchReady(ring);
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const launchUrl = `${site}/launches/${ring.slug}`;
  const badgeUrl = `${site}/api/rings/${ring.slug}/badge`;
  const embed = `<a href="${escapeHtmlAttribute(launchUrl)}"><img src="${escapeHtmlAttribute(badgeUrl)}" alt="${escapeHtmlAttribute(ring.startupName)} rung in on The Anti-Balcony" /></a>`;

  const structuredData = searchReady ? {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${ring.startupName} Startup Launch`,
    description: ring.whatItDoes || ring.tagline,
    datePublished: ring.createdAt,
    url: launchUrl,
    primaryImageOfPage: ring.imageUrl ? { "@type": "ImageObject", url: ring.imageUrl } : undefined,
    about: {
      "@type": "Organization",
      name: ring.startupName,
      url: ring.website || undefined,
      sameAs: ring.socialUrl ? [ring.socialUrl] : undefined,
      description: ring.whatItDoes || undefined,
      founder: ring.founder ? { "@type": "Person", name: ring.founder } : undefined,
    },
  } : null;

  return (
    <SeoShell>
      <article className="seo-main">
        {structuredData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(structuredData) }} />}
        <p className="seo-breadcrumb">PUBLIC RING / {ring.category?.toUpperCase() || "STARTUP LAUNCH"}</p>

        <div className="ring-detail-head">
          <div>
            <h1>{ring.startupName}</h1>
            <p className="seo-lede">{ring.tagline || ring.whatItDoes || "Launched in public on The Anti-Balcony."}</p>
            <div className="ring-meta">
              <span>RUNG IN {new Date(ring.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }).toUpperCase()}</span>
              {ring.category && <span>{ring.category.toUpperCase()}</span>}
              <span>{ring.status.toUpperCase()}</span>
            </div>
            <div className="de-actions">
              {ring.website && <a className="de-primary" href={ring.website} target="_blank" rel="noreferrer">Visit startup</a>}
              {ring.socialUrl && <a className="de-secondary" href={ring.socialUrl} target="_blank" rel="noreferrer">Founder / social</a>}
            </div>
          </div>
          <div className="ring-detail-image">
            {ring.imageUrl ? <img src={ring.imageUrl} alt={`${ring.startupName} product`} /> : <div className="ring-detail-placeholder">PRODUCT IMAGE NOT ADDED YET</div>}
          </div>
        </div>

        <div className="ring-body">
          <article><h2>What it does</h2><p>{ring.whatItDoes || "This founder has not completed the product description yet."}</p></article>
          <article><h2>Who it is for</h2><p>{ring.intendedCustomer || "The intended customer has not been added yet."}</p></article>
          <article><h2>The problem</h2><p>{ring.problem || "The problem statement has not been added yet."}</p></article>
          <article><h2>Founder story</h2><p>{ring.story || (ring.founder ? `Launched by ${ring.founder}.` : "The founder story has not been added yet.")}</p></article>
        </div>

        <section className="ring-badge">
          <p className="seo-breadcrumb">Share the launch artifact</p>
          <h2>Rung in on The Anti-Balcony.</h2>
          <p>Use this badge on a website, launch post or founder page. It links back to the permanent public Ring.</p>
          <img src={`/api/rings/${ring.slug}/badge`} alt={`${ring.startupName} launch badge`} />
          <pre>{embed}</pre>
        </section>

        {!searchReady && <p className="noindex-note">This Ring is intentionally marked noindex until the profile includes the startup category, product description, intended customer, founder or team, problem, founder story, product image, website and social link.</p>}
      </article>
    </SeoShell>
  );
}
