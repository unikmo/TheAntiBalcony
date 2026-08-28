import { pageMetadata } from "@/lib/discovery";
import Link from "next/link";
import { PopShell } from "@/components/PopShell";
import { listPublicPops } from "@/lib/pop-requests";
export const dynamic = "force-dynamic";
export const metadata = pageMetadata("Moments", "Reviewed, opt-in celebrations from companies and individuals. Videos stay on their original social platforms; The Pop Moment links to them.", "/moments");
export default async function MomentsPage() {
  const { moments, unavailable } = await listPublicPops();
  return <PopShell><section className="pop-wrap pop-page pop-page-wide"><p className="pop-eyebrow">The moments wall</p><h1>Good things<br /><em>happened here.</em></h1><p className="pop-intro">Company wins. Life milestones. Your kind of POP.</p>
    {unavailable ? <p className="pop-alert">The moments wall is temporarily unavailable. The <Link href="/capture-guide">capture guide</Link> is still here.</p> : moments.length ? <div className="pop-grid">{moments.map(moment => <Link className="pop-moment" key={moment.id} href={`/moments/${moment.id}`}><p className="pop-eyebrow">{moment.occasion}</p><h2>{moment.title}</h2><time dateTime={moment.moment_date}>{moment.moment_date}</time><p>See the moment ↗</p></Link>)}</div> : <p>Our first POPs are still to come. <Link href="/launch">Share yours ↗</Link></p>}
    <p className="pop-note">Only reviewed, opt-in moments appear here. Videos stay on their original platforms.</p>
  </section></PopShell>;
}
