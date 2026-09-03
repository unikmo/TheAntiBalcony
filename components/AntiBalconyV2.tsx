"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Moment = { slug: string; label: string; prompt: string; screen: string; image: string };

const moments: Moment[] = [
  { slug: "proposal", label: "Proposal", prompt: "Ask it in lights.", screen: "WILL YOU MARRY ME?", image: "https://images.pexels.com/photos/3038145/pexels-photo-3038145.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop" },
  { slug: "wedding", label: "Wedding", prompt: "Put your day up there.", screen: "THIS IS OUR DAY", image: "https://images.pexels.com/photos/18047314/pexels-photo-18047314.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop" },
  { slug: "birthday", label: "Birthday", prompt: "Make their day epic.", screen: "HAPPY BIRTHDAY", image: "https://images.pexels.com/photos/7337165/pexels-photo-7337165.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop" },
  { slug: "baby", label: "Baby shower", prompt: "Welcome them big.", screen: "HELLO, LITTLE ONE", image: "https://images.pexels.com/photos/29324785/pexels-photo-29324785.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop" },
  { slug: "love", label: "I love you", prompt: "Say it where it cannot hide.", screen: "I LOVE YOU", image: "https://images.pexels.com/photos/30531610/pexels-photo-30531610.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop" },
  { slug: "memories", label: "Our memories", prompt: "Give the memory a stage.", screen: "OUR STORY", image: "https://images.pexels.com/photos/8848781/pexels-photo-8848781.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop" },
  { slug: "anniversary", label: "Anniversary", prompt: "Celebrate another trip around the sun.", screen: "STILL US", image: "https://images.pexels.com/photos/4015089/pexels-photo-4015089.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop" },
  { slug: "graduation", label: "Graduation", prompt: "Give the achievement a skyline.", screen: "YOU DID IT", image: "https://images.pexels.com/photos/37296595/pexels-photo-37296595.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop" },
  { slug: "achievement", label: "Big win", prompt: "You earned it. Let it show.", screen: "THIS IS YOUR MOMENT", image: "https://images.pexels.com/photos/6250860/pexels-photo-6250860.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop" },
  { slug: "launch", label: "Launch", prompt: "Make going live feel live.", screen: "WE'RE LIVE", image: "https://images.pexels.com/photos/6913228/pexels-photo-6913228.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop" },
];

const offers = [
  { name: "FREE", price: "$0", note: "Start with the idea", text: "Explore occasions and see how your moment could look before you commit.", href: "#occasions", cta: "Explore free" },
  { name: "UNIKMO CARD", price: "$199", note: "Curated moment card", text: "We curate the message and imagery and deliver one finished UNIKMO card. Additional personalized cards are +$12 each.", href: "#unikmo-card", cta: "See what you get" },
  { name: "SHOW IT", price: "$399", note: "Times Square", text: "Put your moment on an eligible Times Square screen and receive verified display proof.", href: "/book?package=snapshot", cta: "Choose show" },
  { name: "SHOW + KEEP", price: "$549", note: "Most popular", text: "Show it in Times Square, then receive proof and a keepsake film made for sharing.", href: "/book?package=video", cta: "Choose complete", featured: true },
];

function screenSize(text: string) { if (text.length <= 12) return "pm-screen-short"; if (text.length <= 18) return "pm-screen-medium"; return "pm-screen-long"; }
function bookingUrl(occasion?: string) { return occasion ? `/book?occasion=${encodeURIComponent(occasion)}` : "/book"; }

export function AntiBalconyV2() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const moment = moments[activeIndex];
  useEffect(() => { if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; const timer = window.setInterval(() => setActiveIndex((current) => (current + 1) % moments.length), 3800); return () => window.clearInterval(timer); }, [paused]);

  return (
    <main className="pm-home">
      <header className="pm-header">
        <Link href="/" className="pm-brand" aria-label="The Pop Moment home"><strong>THE <span>POP</span> MOMENT</strong><small>A PlanetHike Project</small></Link>
        <nav aria-label="Main navigation"><a href="#how">How it works</a><a href="#occasions">Occasions</a><a href="#pricing">Pricing</a></nav>
        <Link href={bookingUrl()} className="pm-button pm-button-small">Book your moment</Link>
      </header>

      <section className="pm-hero" aria-labelledby="pm-title">
        <div className="pm-hero-copy">
          <p className="pm-eyebrow">TIMES SQUARE · NEW YORK</p><h1 id="pm-title">Make your<br />moment <em>pop.</em></h1><h2>Celebrate it. Show it. Keep it.</h2>
          <p className="pm-lede">Your moment on one of the world&apos;s most iconic stages. Big enough to feel unforgettable. Simple enough to book.</p>
          <div className="pm-hero-actions"><Link href={bookingUrl(moment.label)} className="pm-button">Book your moment</Link><a href="#how" className="pm-button pm-button-ghost">How it works</a></div>
          <p className="pm-promise">Choose the date and a four-hour window. We handle the exact scheduling.</p>
        </div>
        <div className="pm-stage" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
          <video autoPlay muted loop playsInline preload="metadata" poster="/antibalcony-times-square.webp" aria-hidden="true"><source src="/antibalcony-times-square-loop-lite.mp4" type="video/mp4" /></video>
          <div className="pm-stage-shade" aria-hidden="true" /><div className="pm-confetti" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
          <div className={`pm-screen ${screenSize(moment.screen)}`} key={moment.slug} style={{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.05), rgba(0,0,0,.45)), url("${moment.image}")` }}><small>{moment.label}</small><strong>{moment.screen}</strong><span>THE POP MOMENT · TIMES SQUARE</span></div>
          <div className="pm-stage-caption" key={`${moment.slug}-caption`}><small>{moment.label}</small><strong>{moment.prompt}</strong></div>
          <button type="button" className="pm-stage-arrow pm-stage-prev" aria-label="Previous occasion" onClick={() => setActiveIndex((activeIndex - 1 + moments.length) % moments.length)}>←</button><button type="button" className="pm-stage-arrow pm-stage-next" aria-label="Next occasion" onClick={() => setActiveIndex((activeIndex + 1) % moments.length)}>→</button>
        </div>
      </section>

      <section className="pm-occasions" id="occasions" aria-labelledby="occasion-title"><div className="pm-section-head pm-section-head-center"><p>CHOOSE YOUR OCCASION</p><h2 id="occasion-title">What are we celebrating?</h2></div><div className="pm-occasion-rail">{moments.map((item, index) => <button type="button" key={item.slug} className={index === activeIndex ? "is-active" : ""} onClick={() => setActiveIndex(index)} aria-pressed={index === activeIndex}><span className="pm-occasion-image" style={{ backgroundImage: `linear-gradient(180deg, transparent 45%, rgba(0,0,0,.72)), url("${item.image}")` }} /><strong>{item.label}</strong><small>{item.prompt}</small></button>)}</div></section>

      <section className="pm-story" id="how" aria-labelledby="story-title"><div className="pm-section-head pm-section-head-center"><p>ONE MOMENT · THREE BEATS</p><h2 id="story-title"><em>Pop.</em> Show it. <em>Keep it.</em></h2></div><div className="pm-story-grid"><article><div className="pm-story-image pm-pop-image"><span>1</span></div><div><h3>Pop the moment.</h3><p>You celebrate it. We make the experience feel like something is happening—not another cold transaction.</p></div></article><article><div className="pm-story-image pm-show-image"><span>2</span></div><div><h3>Show it in Times Square.</h3><p>Your creative goes live on your selected date within the confirmed four-hour window.</p></div></article><article><div className="pm-story-image pm-keep-image"><span>3</span></div><div><h3>Keep the proof.</h3><p>You leave with verified proof—and, on Show + Keep, a shareable keepsake film.</p></div></article></div></section>

      <section className="pm-pricing" id="pricing" aria-labelledby="pricing-title"><div className="pm-section-head pm-section-head-center"><p>SIMPLE · TRANSPARENT</p><h2 id="pricing-title">Start small. Make it unforgettable.</h2></div><div className="pm-price-grid">{offers.map((offer) => <article key={offer.name} className={offer.featured ? "is-featured" : ""}>{offer.featured && <span className="pm-popular">MOST POPULAR</span>}<small>{offer.note}</small><h3>{offer.name}</h3><strong>{offer.price}</strong><p>{offer.text}</p><Link href={offer.href} className="pm-price-cta">{offer.cta}</Link></article>)}</div><p className="pm-price-note">For Times Square bookings, choose a date, preferred four-hour window and backup. Exact playback minute stays flexible so fulfillment stays easy. Exceptional non-fulfillment is refunded in full.</p></section>

      <section className="pm-card-feature" id="unikmo-card" aria-labelledby="pm-card-title">
        <div className="pm-card-visual" aria-label="Example UNIKMO card front and back"><img className="pm-card-front" src="https://raw.githubusercontent.com/unikmo/Unikmo/main/public/card-front.png" alt="UNIKMO card front example" /><img className="pm-card-back" src="https://raw.githubusercontent.com/unikmo/Unikmo/main/public/card-back.png" alt="UNIKMO card back example" /></div>
        <div className="pm-card-copy"><p className="pm-eyebrow">CURATED FOR YOU</p><h2 id="pm-card-title">Not a template.<br />Your moment, turned into a card.</h2><p>You send the photos, names and story. We select the strongest material, shape the message and curate the finished UNIKMO card so it feels intentional—not assembled.</p><div className="pm-card-includes"><span><strong>$199</strong> first finished curated card</span><span><strong>+$12</strong> each additional personalized card</span></div><p className="pm-card-clarifier">An additional card means another personalized version—for another person, message or variation. Sending the identical finished card again does not create another curation charge.</p><a href="https://unikmo.com/" target="_blank" rel="noreferrer" className="pm-button">Create my curated card</a></div>
      </section>

      <section className="pm-flow" aria-labelledby="flow-title"><div className="pm-section-head pm-section-head-center"><p>HOW IT WORKS</p><h2 id="flow-title">Three decisions. We handle the media complexity.</h2></div><div className="pm-flow-grid"><article><span>01</span><h3>Choose your moment.</h3><p>Pick the occasion, package, date and preferred part of day.</p></article><article><span>02</span><h3>Send the creative.</h3><p>Upload your image or 15-second vertical video. We validate it before payment.</p></article><article><span>03</span><h3>We show it. You keep it.</h3><p>After payment, we secure the placement, run the proof workflow and deliver your keepsake.</p></article></div></section>

      <section className="pm-final" aria-labelledby="pm-final-title"><div><p>YOUR MOMENT DESERVES THE SPOTLIGHT.</p><h2 id="pm-final-title">Let&apos;s make it <em>pop.</em></h2><Link href={bookingUrl()} className="pm-button">Book your moment</Link></div></section>
      <footer className="pm-footer"><div><strong>THE POP MOMENT</strong><span>A PlanetHike Project · Times Square moments with proof you can keep.</span></div><nav aria-label="Footer navigation"><Link href="/imprint">Imprint</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><a href="mailto:hello@antibalcony.com">Contact</a></nav><span>© {new Date().getFullYear()}</span></footer>
    </main>
  );
}
