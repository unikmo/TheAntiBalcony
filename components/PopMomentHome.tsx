"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Moment = {
  slug: string;
  label: string;
  screen: string;
  prompt: string;
  image: string;
};

const moments: Moment[] = [
  { slug: "proposal", label: "Proposal", screen: "WILL YOU MARRY ME?", prompt: "Ask it where the whole square can see it.", image: "https://images.pexels.com/photos/3038145/pexels-photo-3038145.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop" },
  { slug: "wedding", label: "Wedding", screen: "THIS IS OUR DAY", prompt: "Put the day you will never forget in lights.", image: "https://images.pexels.com/photos/18047314/pexels-photo-18047314.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop" },
  { slug: "birthday", label: "Birthday", screen: "HAPPY BIRTHDAY", prompt: "For the person who deserves more than another post.", image: "https://images.pexels.com/photos/7337165/pexels-photo-7337165.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop" },
  { slug: "baby", label: "Baby shower", screen: "HELLO, LITTLE ONE", prompt: "Welcome them to the world in the middle of it.", image: "https://images.pexels.com/photos/29324785/pexels-photo-29324785.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop" },
  { slug: "love", label: "I love you", screen: "I LOVE YOU", prompt: "Three words. One impossible-to-ignore screen.", image: "https://images.pexels.com/photos/30531610/pexels-photo-30531610.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop" },
  { slug: "memories", label: "Our memories", screen: "OUR STORY", prompt: "Some memories deserve more than twenty-four hours.", image: "https://images.pexels.com/photos/8848781/pexels-photo-8848781.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop" },
  { slug: "anniversary", label: "Anniversary", screen: "STILL US", prompt: "Mark the years with something that feels like them.", image: "https://images.pexels.com/photos/4015089/pexels-photo-4015089.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop" },
  { slug: "graduation", label: "Graduation", screen: "YOU DID IT", prompt: "Give the achievement a skyline.", image: "https://images.pexels.com/photos/37296595/pexels-photo-37296595.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop" },
  { slug: "achievement", label: "Big win", screen: "THIS IS YOUR MOMENT", prompt: "You earned it. Let it show.", image: "https://images.pexels.com/photos/6250860/pexels-photo-6250860.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop" },
  { slug: "launch", label: "Launch", screen: "WE'RE LIVE", prompt: "Make going live feel live.", image: "https://images.pexels.com/photos/6913228/pexels-photo-6913228.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop" },
];

const offers = [
  { name: "FREE", price: "$0", note: "See the idea", text: "Explore occasions and picture your moment before you commit.", href: "#moments", cta: "Explore" },
  { name: "UNIKMO CARD", price: "$199", note: "Curated for you", text: "One finished curated card. Additional personalized cards are +$12 each.", href: "#keep", cta: "See the card" },
  { name: "SHOW IT", price: "$399", note: "Times Square", text: "Your moment on an eligible Times Square screen, with verified display proof.", href: "/book?package=snapshot", cta: "Show it" },
  { name: "SHOW + KEEP", price: "$549", note: "Most popular", text: "Times Square display, verified proof and a shareable keepsake film.", href: "/book?package=video", cta: "Choose complete", featured: true },
];

export function PopMomentHome() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const moment = moments[active];

  useEffect(() => {
    if (paused || typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % moments.length), 4600);
    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <main className="pm4">
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
          <h1>Celebrate it.<br />Show it. <em>Keep it.</em></h1>
          <p className="pm4-sub">Your message on one of the world&apos;s most famous stages. Then a piece of the moment you can keep.</p>
          <div className="pm4-actions">
            <Link href={`/book?occasion=${encodeURIComponent(moment.label)}`} className="pm4-primary">Create your Pop Moment</Link>
            <a href="#moments" className="pm4-secondary">See the moments</a>
          </div>
          <p className="pm4-window">Choose your date and a four-hour window. We handle the exact Times Square scheduling.</p>
        </div>

        <div className="pm4-stage-wrap" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
          <div className="pm4-stage">
            <img className="pm4-stage-photo" src="/antibalcony-times-square.webp" alt="Times Square at night" />
            <div className="pm4-billboard" key={moment.slug}>
              <img src={moment.image} alt="" />
              <div className="pm4-billboard-shade" />
              <div className="pm4-billboard-copy">
                <small>{moment.label}</small>
                <strong>{moment.screen}</strong>
                <span>THE POP MOMENT</span>
              </div>
            </div>
            <div className="pm4-stage-line">
              <span>{moment.label}</span>
              <strong>{moment.prompt}</strong>
            </div>
            <button className="pm4-arrow pm4-prev" type="button" aria-label="Previous moment" onClick={() => setActive((active - 1 + moments.length) % moments.length)}>←</button>
            <button className="pm4-arrow pm4-next" type="button" aria-label="Next moment" onClick={() => setActive((active + 1) % moments.length)}>→</button>
          </div>
          <div className="pm4-tabs" id="moments" aria-label="Choose an occasion">
            {moments.map((item, index) => (
              <button type="button" key={item.slug} className={index === active ? "is-active" : ""} onClick={() => setActive(index)}>{item.label}</button>
            ))}
          </div>
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
        <nav><Link href="/imprint">Imprint</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><a href="mailto:hello@antibalcony.com">Contact</a></nav>
        <span>© {new Date().getFullYear()}</span>
      </footer>
    </main>
  );
}
