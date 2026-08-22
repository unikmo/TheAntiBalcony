import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoCta, SeoShell } from "@/components/SeoPage";
import { GUIDE_MAP, GUIDES } from "@/lib/seo-content";

export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = GUIDE_MAP[slug];
  if (!guide) return {};
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: { title: guide.title, description: guide.description, type: "article" },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = GUIDE_MAP[slug];
  if (!guide) notFound();

  return (
    <SeoShell>
      <article className="seo-main">
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
