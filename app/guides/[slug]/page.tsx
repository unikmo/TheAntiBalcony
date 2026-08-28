import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoCta, SeoShell } from "@/components/SeoPage";
import { GUIDE_MAP, GUIDES } from "@/lib/seo-content";
import Link from "next/link";
import { breadcrumbSchema, pageMetadata, webpageSchema } from "@/lib/discovery";
import { StructuredData } from "@/components/StructuredData";

export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = GUIDE_MAP[slug];
  if (!guide) return {};
  return pageMetadata(guide.title, guide.description, `/guides/${guide.slug}`);
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = GUIDE_MAP[slug];
  if (!guide) notFound();

  return (
    <SeoShell>
      <article className="seo-main">
        <StructuredData data={webpageSchema(`/guides/${guide.slug}`, guide.title, guide.description)} />
        <StructuredData data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Guides", path: "/guides" }, { name: guide.title, path: `/guides/${guide.slug}` }])} />
        <nav aria-label="Breadcrumb"><Link href="/">Home</Link> / <Link href="/guides">Guides</Link> / <span>{guide.title}</span></nav>
        <p className="seo-breadcrumb">{guide.eyebrow}</p>
        <h1>{guide.title}</h1>
        <p className="seo-lede">{guide.intro}</p>

        <div className="seo-content">
          {guide.sections.map((section) => (
            <section className="seo-section" key={section.heading}>
              <h2>{section.heading}</h2>
              <div>{section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
            </section>
          ))}
        </div>

        <SeoCta />

        <section className="seo-related">
          <h2>Related launch guides</h2>
          <div>{guide.related.map((related) => <a key={related} href={`/guides/${related}`}>{GUIDE_MAP[related]?.title || related}</a>)}</div>
        </section>
      </article>
    </SeoShell>
  );
}
