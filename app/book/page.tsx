import type { Metadata } from "next";
import Link from "next/link";
import { MomentBookingForm } from "@/components/MomentBookingForm";

export const metadata: Metadata = {
  title: "Book Your Times Square Moment",
  description: "Choose your date and four-hour Times Square display window, upload your creative, pay securely, and let The Pop Moment handle the exact media scheduling and proof workflow.",
  alternates: { canonical: "/book" },
};

type Tier = "snapshot" | "video";

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ package?: string; occasion?: string; checkout?: string; order_ref?: string }>;
}) {
  const params = await searchParams;
  const initialTier: Tier = params.package === "video" ? "video" : "snapshot";

  return (
    <main className="booking-page">
      <header className="booking-header">
        <Link href="/" className="booking-brand"><span aria-hidden="true" />THE POP MOMENT</Link>
        <Link href="/">Back to moments</Link>
      </header>

      <div className="booking-shell">
        <section className="booking-intro">
          <p className="booking-eyebrow">TIMES SQUARE · NEW YORK</p>
          <h1>Choose the day.<br />We handle the exact scheduling.</h1>
          <p>Pick the moment, one of the two Times Square packages, and the part of day. We validate your creative, take secure payment, then route the booking across eligible inventory using the flexibility you selected.</p>
          <div className="booking-contract">
            <span><b>Your day</b> selected by you</span>
            <span><b>Your window</b> preferred + backup flexibility</span>
            <span><b>Our job</b> exact playback scheduling + proof</span>
          </div>
          <p className="booking-risk-note">If an exceptional provider or inventory issue makes fulfillment impossible, the payment is automatically refunded in full.</p>
        </section>

        <MomentBookingForm initialTier={initialTier} initialOccasion={params.occasion || "Proposal"} checkout={params.checkout} orderRef={params.order_ref} />
      </div>

      <footer className="booking-footer">
        <span>© {new Date().getFullYear()} The Pop Moment · A PlanetHike Project</span>
        <nav><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/imprint">Imprint</Link></nav>
      </footer>
    </main>
  );
}
