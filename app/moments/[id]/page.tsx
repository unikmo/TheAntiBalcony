import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PopShell } from "@/components/PopShell";
import { getPublicPop } from "@/lib/pop-requests";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "A POP moment", robots: { index: false, follow: false } };
export default async function MomentPage({ params }: { params: Promise<{ id: string }> }) {
  const moment = await getPublicPop((await params).id);
  if (!moment) notFound();
  return <PopShell><article className="pop-wrap pop-page"><p className="pop-eyebrow">{moment.occasion} · <time dateTime={moment.moment_date}>{moment.moment_date}</time></p><h1>{moment.title}</h1>
    <p>A celebration worth sharing.</p>{moment.source_url && <a className="pop-button" href={moment.source_url} target="_blank" rel="ugc nofollow noopener noreferrer">Watch the original POP ↗</a>}
    <p className="pop-note">Video opens on its original platform, which may ask you to sign in. We do not host or archive this video. If it has been removed there, it will no longer play.</p>
    <p className="pop-note">To request a correction or removal, contact hello@antibalcony.com with this page’s link.</p>
  </article></PopShell>;
}
