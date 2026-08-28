import { pageMetadata } from "@/lib/discovery";
import { PopShell } from "@/components/PopShell";
import { PopRequestForm } from "@/components/PopRequestForm";
import { isPopOffer } from "@/lib/pop-offers";

export const metadata = pageMetadata("Your moment", "Share your POP or request a curated UNIKMO memory. No payment at this stage.", "/launch", false);

export default async function LaunchPage({ searchParams }: { searchParams: Promise<{ offer?: string; tier?: string }> }) {
  const { offer, tier } = await searchParams;
  return (
    <PopShell><section className="pop-wrap pop-page"><p className="pop-eyebrow">Your story starts here</p><h1>Make it<br /><em>your moment.</em></h1><p className="pop-intro">A few details. Your kind of celebration. We’ll take it from there.</p>
      {tier && tier !== "free" && <p className="pop-alert">Our collection has changed. Previous billboard and production packages are no longer available for new orders. Please choose from the experiences below.</p>}
      <PopRequestForm initialOffer={isPopOffer(offer) ? offer : "free"} />
    </section></PopShell>
  );
}
