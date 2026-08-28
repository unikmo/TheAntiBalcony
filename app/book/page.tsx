import type { Metadata } from "next";
import Link from "next/link";
import { MomentBookingForm } from "@/components/MomentBookingForm";

export const metadata: Metadata = {
  title: "Book Your Times Square Moment",
  description: "Choose your date and four-hour Times Square display window. We check inventory and creative before payment, then confirm the booking and proof workflow.",
  alternates: { canonical: "/book" },
};

type Tier = "snapshot" | "video" | "takeover";

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ package?: string; occasion?: string; checkout?: string; order_ref?: string }>;
}) {
  const params = await searchParams;
  const initialTier: Tier = params.package === "snapshot" || params.package === "takeover" ? params.package : "video";

  return (
    <main className="booking-page">
      <header className="booking-header">
        <Link href="/" className="booking-brand"><span aria-hidden="true" />THE ANTI-BALCONY</Link>
        <Link href="/">Back to moments</Link>
      </header>

      <div className="booking-shell">
        <section className="booking-intro">
          <p className="booking-eyebrow">TIMES SQUARE · NEW YORK</p>
          <h1>Choose the day.<br />We handle the exact scheduling.</h1>
          <p>Pick the moment, package and part of the day. We check eligible Times Square inventory and your creative before you pay.</p>
          <div className="booking-contract">
            <span><b>Guaranteed</b> selected date</span>
            <span><b>Guaranteed</b> confirmed 4-hour window</span>
            <span><b>Flexible</b> exact playback minute</span>
          </div>
        </section>

        <MomentBookingForm
          initialTier={initialTier}
          initialOccasion={params.occasion || "Proposal"}
          checkout={params.checkout}
          orderRef={params.order_ref}
        />
      </div>

      <footer className="booking-footer">
        <span>© {new Date().getFullYear()} The Anti-Balcony</span>
        <nav><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/imprint">Imprint</Link></nav>
      </footer>
    </main>
  );
}
