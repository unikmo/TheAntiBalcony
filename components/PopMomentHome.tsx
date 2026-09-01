"use client";

import Link from "next/link";
import { useState } from "react";

type Moment = {
  slug: string;
  label: string;
  prompt: string;
};

const moments: Moment[] = [
  { slug: "proposal", label: "Proposal", prompt: "Ask it where the whole square can see it." },
  { slug: "wedding", label: "Wedding", prompt: "Put the day you will never forget in lights." },
  { slug: "birthday", label: "Birthday", prompt: "For the person who deserves more than another post." },
  { slug: "baby", label: "Baby shower", prompt: "Welcome them to the world in the middle of it." },
  { slug: "love", label: "I love you", prompt: "Three words. One impossible-to-ignore screen." },
  { slug: "memories", label: "Our memories", prompt: "Some memories deserve more than twenty-four hours." },
  { slug: "anniversary", label: "Anniversary", prompt: "Mark the years with something that feels like them." },
  { slug: "graduation", label: "Graduation", prompt: "Give the achievement a skyline." },
  { slug: "achievement", label: "Big win", prompt: "You earned it. Let it show." },
  { slug: "launch", label: "Launch", prompt: "Make going live feel live." },
];

const offers = [
  { name: "FREE", price: "$0", note: "See the idea", text: "Explore occasions and picture your moment before you commit.", href: "#moments", cta: "Explore" },
  { name: "UNIKMO CARD", price: "$199", note: "Curated for you", text: "One finished curated card. Additional personalized cards are +$12 each.", href: "#keep", cta: "See the card" },
  { name: "SHOW IT", price: "$399", note: "Times Square", text: "Your moment on an eligible Times Square screen, with verified display proof.", href: "/book?package=snapshot", cta: "Show it" },
  { name: "SHOW + KEEP", price: "$549", note: "Most popular", text: "Times Square display, verified proof and a shareable keepsake film.", href: "/book?package=video", cta: "Choose complete", featured: true },
];

export function PopMomentHome() {
  const [active, setActive] = useState(0);
  const moment = moments[active];

  return (
    <main className="pm4 pm4-natural">
      <header className="pm4-header">
        <Link href="/" className="pm4-brand" aria-label="The Pop Moment home">THE <em>POP</em> MOMENT</Link>
        <nav aria-label="Main navigation">
          <a href="#moments">Moments</a>
          <a href="#keep">Keep it</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <Link href={`/book?occasion=${encodeURIComponent(moment.label)}`} className="pm4-nav-cta">Create your moment</Link>
      </header>

      <section className="pm4-hero">
        <div className="pm4-hero-copy">
          <p className="pm4-kicker">THE POP MOMENT · TIMES SQUARE</p>
          <h1>Celebrate it. Show it. <em>Keep it.</em></h1>
          <p className="pm4-sub">Have a pop moment in mind? Put it on a Times Square screen and keep the memory afterwards.</p>
          <div className="pm4-actions">
            <Link href={`/book?occasion=${encodeURIComponent(moment.label)}`} className="pm4-primary">Create your Pop Moment</Link>
            <a href="#moments" className="pm4-secondary">See the moments</a>
          </div>
          <p className="pm4-window">Choose your date and a 4-hour window. We handle the exact scheduling.</p>
        </div>

        <div className="pm4-stage-wrap">
          <div className="pm4-stage pm4-natural-stage">
            <img
              className="pm4-stage-photo"
              src="/api/assets/natural-nasdaq"
              alt="A proposal displayed naturally across the Nasdaq MarketSite screen in Times Square"
            />
          </div>
          <div className="pm4-natural-caption" aria-label="Times Square visual example">
            <strong>THIS COULD BE YOUR MOMENT</strong>
            <span>Proposal · Birthday · Wedding · Launch</span>
          </div>
          <div className="pm4-tabs" id="moments" aria-label="Choose an occasion">
            {moments.map((item, index) => (
              <button type="button" key={item.slug} className={index === active ? "is-active" : ""} onClick={() => setActive(index)}>{item.label}</button>
            ))}
          </div>
          <p className="pm4-active-prompt">{moment.prompt}</p>
        </div>
      </section>

      <section className="pm4-pop">
        <div className="pm4-pop-image" />
        <div className="pm4-pop-copy">
          <p>THE REVEAL</p>
          <h2>Make it feel like<br />something <em>happened.</em></h2>
          <span>Champagne. Confetti. The question. The yes. The cheer. The screenshot everyone sends afterward.</span>
        </div>
      </section>

      <section className="pm4-keep" id="keep">
        <div className="pm4-keep-copy">
          <p>KEEP IT</p>
          <h2>The screen goes dark.<br /><em>The moment doesn&apos;t.</em></h2>
          <p className="pm4-body">For the curated UNIKMO option, send us the photos, names and story. We choose the strongest material, shape the message and finish the card for you.</p>
          <div className="pm4-card-price"><strong>$199</strong><span>first curated card</span><b>+$12</b><span>each additional personalized card</span></div>
          <a href="https://unikmo.com/" className="pm4-primary" target="_blank" rel="noreferrer">Create my card</a>
        </div>
        <div className="pm4-flip" tabIndex={0} aria-label="UNIKMO card. Hover or focus to see the back.">
          <div className="pm4-flip-inner">
            <div className="pm4-card-face pm4-card-front"><img src="https://raw.githubusercontent.com/unikmo/Unikmo/main/public/card-front.png" alt="UNIKMO card front" /></div>
            <div className="pm4-card-face pm4-card-back"><img src="https://raw.githubusercontent.com/unikmo/Unikmo/main/public/card-back.png" alt="UNIKMO card back" /></div>
          </div>
          <span className="pm4-flip-hint">Hover to turn it over</span>
        </div>
      </section>

      <section className="pm4-pricing" id="pricing">
        <div className="pm4-section-head"><p>CHOOSE YOUR MOMENT</p><h2>Start where it feels right.</h2></div>
        <div className="pm4-price-grid">
          {offers.map((offer) => (
            <article key={offer.name} className={offer.featured ? "is-featured" : ""}>
              {offer.featured && <span className="pm4-badge">MOST POPULAR</span>}
              <small>{offer.note}</small>
              <h3>{offer.name}</h3>
              <strong>{offer.price}</strong>
              <p>{offer.text}</p>
              <Link href={offer.href} className="pm4-price-link">{offer.cta} <span>→</span></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="pm4-how">
        <div className="pm4-section-head"><p>THREE STEPS</p><h2>Big moment. Small amount of work.</h2></div>
        <div className="pm4-how-grid">
          <article><span>01</span><h3>Choose the moment.</h3><p>Occasion, package, date and preferred four-hour window.</p></article>
          <article><span>02</span><h3>Send what matters.</h3><p>Your photo or video, names and the message you want the world to see.</p></article>
          <article><span>03</span><h3>We make it happen.</h3><p>We handle the screen, proof and keepsake workflow. You get the moment.</p></article>
        </div>
      </section>

      <section className="pm4-final">
        <p>WHAT ARE WE CELEBRATING?</p>
        <h2>Make this one <em>impossible to forget.</em></h2>
        <Link href="/book" className="pm4-primary">Create your Pop Moment</Link>
      </section>

      <footer className="pm4-footer">
        <strong>THE <em>POP</em> MOMENT</strong>
        <nav><Link href="/imprint">Imprint</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><a href="mailto:hello@thepopmoment.com">Contact</a></nav>
        <span>© {new Date().getFullYear()}</span>
      </footer>
    </main>
  );
}
