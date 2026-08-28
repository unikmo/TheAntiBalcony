import Image from "next/image";
import Link from "next/link";
import { PopShell } from "./PopShell";
import { PopPreview } from "./PopPreview";
import { PopHeroCarousel } from "./PopHeroCarousel";
import { EXTRA_CARD_CENTS, money, POP_OFFERS, type PopOffer } from "@/lib/pop-offers";
import { POP_FAQS } from "@/lib/discovery";

export function PopHome() {
  return <PopShell>
    <section className="pop-hero pop-wrap" aria-labelledby="pop-hero-title">
      <h1 id="pop-hero-title">Celebrate it. Show it.<br /><em>Keep it.</em></h1>
      <PopHeroCarousel />
      <Link className="pop-button pop-hero-cta" href="/launch?offer=nasdaq">See yourself here ↗</Link>
    </section>

    <section id="experience" className="pop-wrap pop-section">
      <div className="pop-heading"><p className="pop-eyebrow">Three acts. One memory.</p><h2>It starts with your POP.</h2></div>
      <div className="pop-acts">
        <article><span className="pop-index">01 / POP</span><h3>Celebrate it.</h3><p>Confetti. A cork. A team cheer. You choose the burst; we help you capture it.</p><Link href="/capture-guide">Your filming guide ↗</Link></article>
        <article><span className="pop-index">02 / PUBLIC · OPTIONAL</span><h3>Show it.</h3><p>Share your moment online for free. Or request a bigger stage in Times Square.</p><a href="#times-square">See the possibility ↗</a></article>
        <article><span className="pop-index">03 / PRESERVE</span><h3>Keep it.</h3><p>We curate your footage into a short memory film, linked to a physical UNIKMO card.</p><a href="#packages">Choose your experience ↗</a></article>
      </div>
      <p className="pop-note">For launches and life milestones. No props shipped. No prescribed ritual. Just your moment.</p>
    </section>

    <section id="times-square" className="pop-wrap pop-section pop-split">
      <div><p className="pop-eyebrow">A little moment. A bigger stage.</p><h2>Imagine it<br /><em>in Times Square.</em></h2><p>Your celebration, then the city. We bring the two together in the final film.</p><p className="pop-note">NASDAQ requests are open for review. Booking depends on screen availability, creative approval and confirmed licensed capture. No payment is taken here.</p><Link className="pop-text-link" href="/launch?offer=nasdaq">Request your moment ↗</Link></div>
      <PopPreview />
    </section>

    <section id="packages" className="pop-wrap pop-section">
      <div className="pop-heading"><p className="pop-eyebrow">The collection</p><h2>Small beginning.<br /><em>Lasting feeling.</em></h2></div>
      <div className="pop-offers">
        {(["nasdaq", "keep", "free"] as PopOffer[]).map((offer) => <article id={offer} className={`pop-offer ${offer === "nasdaq" ? "pop-offer-featured" : ""}`} key={offer}>
          <p className="pop-eyebrow">{offer === "free" ? "Share the celebration" : offer === "keep" ? "The memory" : "Times Square · NASDAQ"}</p>
          <h3>{POP_OFFERS[offer].name}</h3><p className="pop-price">{offer === "free" ? "Free" : money(POP_OFFERS[offer].cents)}</p>
          <p className="pop-price-note">{offer === "free" ? "No video upload. No card required." : "USD + applicable tax & delivery"}</p>
          <ul>{(offer === "free" ? ["A self-service capture guide", "A public moment page after review", "Your video stays on your social platform"] : offer === "keep" ? ["Creative direction for your POP", "A curated 30–45 second film", "One revision and one UNIKMO card"] : ["The Keep it experience", "A requested 15-second NASDAQ appearance", "Licensed display footage in your film"]).map((line) => <li key={line}>{line}</li>)}</ul>
          <Link className={`pop-button ${offer !== "nasdaq" ? "pop-button-outline" : ""}`} href={`/launch?offer=${offer}`}>{POP_OFFERS[offer].action} ↗</Link>
          <p className="pop-note">{offer === "free" ? "Selected social features are opt-in, not guaranteed." : offer === "keep" ? "You supply the footage. We make the memory." : "Request only. Availability and capture must be confirmed first."}</p>
        </article>)}
      </div>
    </section>

    <section className="pop-wrap pop-section pop-split pop-card-section">
      <Image src="/unikmo-card.webp" alt="The physical UNIKMO keepsake card" width={1888} height={1340} sizes="(max-width: 720px) 90vw, 45vw" />
      <div><p className="pop-eyebrow">One memory. Everyone who made it.</p><h2>A card for<br /><em>every one of you.</em></h2><p>Add same-memory cards for {money(EXTRA_CARD_CENTS)} each. One film, one shared design, delivered together.</p><p>Each card opens the memory with its own QR link. No typed key. Anyone with the link can watch.</p><p className="pop-note">One card is included in each paid experience. 50 total cards means 49 extras: {money(49 * EXTRA_CARD_CENTS)}, plus the experience, tax and delivery. Personalised designs or separate addresses need a separate quote.</p></div>
    </section>

    <section id="questions" className="pop-wrap pop-section pop-questions"><div className="pop-heading"><p className="pop-eyebrow">A few things, simply.</p><h2>Before your POP.</h2></div>
      {POP_FAQS.map(({ question, answer }) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}
    </section>
    <section className="pop-closing pop-wrap"><p className="pop-eyebrow">A company milestone. A once-in-a-lifetime yes. Yours.</p><h2>What’s your POP?</h2><Link className="pop-button" href="/launch">Let’s begin ↗</Link></section>
  </PopShell>;
}
