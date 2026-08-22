import type { Metadata } from "next";
import { LaunchForm } from "@/components/LaunchForm";
import { SeoShell } from "@/components/SeoPage";

export const metadata: Metadata = {
  title: "Ring In Your Startup",
  description: "Create a public Ring for your startup launch, publish the launch moment and share a permanent startup-launch artifact.",
  alternates: { canonical: "/launch" },
};

export default async function LaunchPage({ searchParams }: { searchParams: Promise<{ tier?: string }> }) {
  const { tier } = await searchParams;
  return (
    <SeoShell>
      <div className="seo-main">
        <p className="seo-breadcrumb">THE ANTI-BALCONY / LAUNCH</p>
        <h1>Ring in your startup.</h1>
        <p className="seo-lede">Create the public launch record first. Then share it across Product Hunt, LinkedIn, X, Hacker News, your mailing list—or turn the launch into a Times Square moment.</p>
        <LaunchForm initialTier={tier} />
      </div>
    </SeoShell>
  );
}
