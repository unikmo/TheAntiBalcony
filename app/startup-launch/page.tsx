import type { Metadata } from "next";
import { SeoCta, SeoShell } from "@/components/SeoPage";

export const metadata: Metadata = {
  title: "Startup Launch Platform",
  description: "Launch your startup in public with a permanent Ring you can share across Product Hunt, LinkedIn, X, communities and your own audience.",
  alternates: { canonical: "/startup-launch" },
};

export default function StartupLaunchPage() {
  return (
    <SeoShell>
      <div className="seo-main">
        <p className="seo-breadcrumb">STARTUP LAUNCH PLATFORM</p>
        <h1>A launch moment, not a launch competition.</h1>
        <p className="seo-lede">The Anti-Balcony is a public startup-launch platform built around a shareable launch ritual called a Ring. It gives founders a permanent launch artifact without asking them to win a leaderboard first.</p>

        <div className="seo-content">
          <section className="seo-section">
            <h2>What a Ring is</h2>
            <div><p>A Ring is the public record of a startup entering the world: what it does, who it is for, the founder behind it, the problem it solves and the date it launched.</p><p>It is designed to be shared before, during or after a launch on other platforms. The Ring belongs to the launch itself, not to one distribution channel.</p></div>
          </section>
          <section className="seo-section">
            <h2>Where it fits</h2>
            <div><p>Product Hunt can provide discovery and feedback. LinkedIn and X can distribute founder stories. Hacker News and specialist communities can create high-quality discussion. Email can activate the audience you already own.</p><p>The Anti-Balcony complements those channels by giving every one of them the same permanent public destination.</p></div>
          </section>
          <section className="seo-section">
            <h2>Why public launches matter</h2>
            <div><p>Launch day disappears quickly when it exists only as a social post. A structured public launch page can keep founder context, product proof and launch date together in a form that remains searchable and linkable.</p><p>Complete Rings can become indexable. Thin Rings remain noindex so the platform does not manufacture empty SEO inventory.</p></div>
          </section>
          <section className="seo-section">
            <h2>From Ring to Times Square</h2>
            <div><p>The public Ring is free. Founders who want a larger launch moment can add Times Square screenshot proof, a short launch film or a coordinated staffed takeover.</p><p>The media package amplifies the Ring; it does not replace the owned public launch record.</p></div>
          </section>
        </div>
        <SeoCta />
      </div>
    </SeoShell>
  );
}
