import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PopShell } from "@/components/PopShell";
import { getCardMemory } from "@/lib/pop-requests";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your memory", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function CardMemoryPage({ params }: { params: Promise<{ token: string }> }) {
  const memory = await getCardMemory((await params).token);
  if (!memory?.final_video_url) notFound();
  return <PopShell><section className="pop-wrap pop-page"><p className="pop-eyebrow">A memory, kept close.</p><h1>{memory.title}</h1><a className="pop-button" href={memory.final_video_url} rel="noreferrer">Open your UNIKMO memory ↗</a><p className="pop-note">No typed key. This card’s link opens the shared memory; anyone with the link can watch.</p></section></PopShell>;
}
