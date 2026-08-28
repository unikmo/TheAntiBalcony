"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Moment = {
  slug: string;
  label: string;
  question: string;
  screen: string;
  note: string;
  art: string;
  image: string;
};

const moments: Moment[] = [
  {
    slug: "proposal",
    label: "Proposal",
    question: "About to ask?",
    screen: "WILL YOU MARRY ME?",
    note: "Make the question impossible to miss.",
    art: "proposal",
    image: "https://images.pexels.com/photos/3038145/pexels-photo-3038145.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop",
  },
  {
    slug: "wedding",
    label: "Wedding",
    question: "Saying I do?",
    screen: "THIS IS OUR DAY",
    note: "Put the date you will never forget above Times Square.",
    art: "wedding",
    image: "https://images.pexels.com/photos/18047314/pexels-photo-18047314.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop",
  },
  {
    slug: "birthday",
    label: "Birthday",
    question: "Someone worth celebrating?",
    screen: "HAPPY BIRTHDAY",
    note: "For the person who deserves more than a post.",
    art: "birthday",
    image: "https://images.pexels.com/photos/7337165/pexels-photo-7337165.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop",
  },
  {
    slug: "baby",
    label: "Baby shower",
    question: "A little one on the way?",
    screen: "HELLO, LITTLE ONE",
    note: "Welcome them to the world in the middle of it.",
    art: "baby",
    image: "https://images.pexels.com/photos/29324785/pexels-photo-29324785.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop",
  },
  {
    slug: "love",
    label: "I love you",
    question: "Want to say it bigger?",
    screen: "I LOVE YOU",
    note: "Three words. One impossible-to-ignore screen.",
    art: "love",
    image: "https://images.pexels.com/photos/30531610/pexels-photo-30531610.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop",
  },
  {
    slug: "memories",
    label: "Our memories",
    question: "A memory worth keeping?",
    screen: "OUR STORY",
    note: "Some moments deserve more than 24 hours.",
    art: "memories",
    image: "https://images.pexels.com/photos/8848781/pexels-photo-8848781.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop",
  },
  {
    slug: "anniversary",
    label: "Anniversary",
    question: "Still choosing each other?",
    screen: "STILL US",
    note: "Mark the years with something that feels like them.",
    art: "anniversary",
    image: "https://images.pexels.com/photos/4015089/pexels-photo-4015089.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop",
  },
  {
    slug: "graduation",
    label: "Graduation",
    question: "They did the work?",
    screen: "YOU DID IT",
    note: "Give the achievement a skyline.",
    art: "graduation",
    image: "https://images.pexels.com/photos/37296595/pexels-photo-37296595.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop",
  },
  {
    slug: "achievement",
    label: "Big win",
    question: "Earned something big?",
    screen: "THIS IS YOUR MOMENT",
    note: "You earned it. Let it show.",
    art: "achievement",
    image: "https://images.pexels.com/photos/6250860/pexels-photo-6250860.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop",
  },
  {
    slug: "launch",
    label: "Launch",
    question: "Built something?",
    screen: "WE'RE LIVE",
    note: "Ring the work into public when it is ready.",
    art: "launch",
    image: "https://images.pexels.com/photos/6913228/pexels-photo-6913228.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop",
  },
];

const offers = [
  {
    name: "SHOW IT",
    price: "$399",
    kicker: "TIMES SQUARE",
    text: "Your creative placed in Times Square with provider-confirmed proof of the display.",
    subject: "Show It — Times Square moment",
  },
  {
    name: "SHOW + KEEP",
    price: "$799",
    kicker: "TIMES SQUARE + FILM",
    text: "The display, proof, and a 15-second keepsake film built for sharing after the moment.",
    subject: "Show + Keep — Times Square moment",
    featured: true,
  },
  {
    name: "THE MOMENT",
    price: "$2,999",
    kicker: "COORDINATED EXPERIENCE",
    text: "A coordinated Times Square experience with on-the-ground coverage and a complete proof package.",
    subject: "The Moment — coordinated Times Square experience",
  },
];

function playBell(fullCeremony = false) {
  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  const ctx = new AudioContextClass();
  const now = ctx.currentTime;
  const duration = fullCeremony ? 8.4 : 1.2;
  const strikes = fullCeremony
    ? [0, 0.34, 0.7, 1.06, 1.43, 1.82, 2.21, 2.6, 3.01, 3.42, 3.84, 4.28, 4.73, 5.18, 5.65, 6.12, 6.6, 7.08, 7.55, 7.93]
    : [0];

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-18, now);
  compressor.knee.setValueAtTime(12, now);
  compressor.ratio.setValueAtTime(5, now);
  compressor.attack.setValueAtTime(0.003, now);
  compressor.release.setValueAtTime(0.12, now);
  compressor.connect(ctx.destination);

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.24, now + 0.012);
  master.gain.setValueAtTime(0.24, now + Math.max(0.5, duration - 0.35));
  master.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  master.connect(compressor);

  strikes.forEach((offset, strikeIndex) => {
    const strike = now + offset;
    const baseFrequency = [880, 988, 1047, 1175][strikeIndex % 4];

    [1, 1.41, 2.08, 2.73].forEach((ratio, toneIndex) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = toneIndex < 3 ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(baseFrequency * ratio, strike);
      oscillator.detune.setValueAtTime((strikeIndex % 2 === 0 ? -1 : 1) * toneIndex * 4, strike);
      gain.gain.setValueAtTime(0.0001, strike);
      gain.gain.exponentialRampToValueAtTime(0.27 / (toneIndex + 1), strike + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, strike + 0.3);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(strike);
      oscillator.stop(strike + 0.34);
    });
  });

  window.setTimeout(() => void ctx.close(), (duration + 0.3) * 1000);
}

function mailto(subject: string) {
  return `mailto:hello@antibalcony.com?subject=${encodeURIComponent(subject)}`;
}

export function AntiBalconyV2() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ringing, setRinging] = useState(false);
  const [recordRevealed, setRecordRevealed] = useState(false);
  const ringTimerRef = useRef<number | null>(null);

  const moment = moments[activeIndex];

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (paused || reducedMotion) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % moments.length);
    }, 2800);

    return () => window.clearInterval(timer);
  }, [paused]);

  useEffect(() => {
    return () => {
      if (ringTimerRef.current) window.clearTimeout(ringTimerRef.current);
    };
  }, []);

  function ringDemo() {
    if (ringing) return;
    setRecordRevealed(false);
    setRinging(true);
    playBell(true);

    if (ringTimerRef.current) window.clearTimeout(ringTimerRef.current);
    ringTimerRef.current = window.setTimeout(() => {
      setRinging(false);
      setRecordRevealed(true);
    }, 8400);
  }

  return (
    <main className="ab-home">
      <header className="ab-header">
        <div className="ab-header-inner">
          <Link className="ab-brand" href="/" aria-label="The Anti-Balcony home">
            <span aria-hidden="true" />
            THE ANTI-BALCONY
          </Link>
          <nav aria-label="Main navigation">
            <a href="#how">How it works</a>
            <a href="#occasions">Occasions</a>
            <a href="#proof">What you get</a>
            <a href="#offer">Pricing</a>
          </nav>
          <a className="ab-header-cta" href={mailto("I want my Times Square moment")}>Book your moment</a>
        </div>
      </header>

      <section className="ab-hero" aria-labelledby="home-title">
        <div className="ab-hero-copy">
          <p>YOUR MOMENT · TIMES SQUARE</p>
          <h1 id="home-title">
            Celebrate it. Show it. <em>Keep it.</em>
          </h1>
          <span>A proposal. A birthday. A wedding. A launch. Or three words you want the world to see.</span>
        </div>

        <div
          className="ab-stage"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          <video
            className="ab-stage-city"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/antibalcony-times-square.webp"
            aria-hidden="true"
          >
            <source src="/antibalcony-times-square-loop-lite.mp4" type="video/mp4" />
          </video>
          <div className="ab-stage-shade" aria-hidden="true" />

          <div className="ab-stage-question" key={`${moment.slug}-question`}>
            <small>{moment.question}</small>
            <strong>{moment.note}</strong>
          </div>

          <div
            className={`ab-screen ab-screen-${moment.art}`}
            key={moment.slug}
            style={{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.08), rgba(0,0,0,.48)), url("${moment.image}")` }}
          >
            <span>{moment.label}</span>
            <strong>{moment.screen}</strong>
            <small>THE ANTI-BALCONY · TIMES SQUARE</small>
          </div>

          <div className="ab-stage-location">TIMES SQUARE · NEW YORK</div>

          <button
            className="ab-stage-control ab-prev"
            type="button"
            aria-label="Previous moment"
            onClick={() => setActiveIndex((current) => (current - 1 + moments.length) % moments.length)}
          >
            ←
          </button>
          <button
            className="ab-stage-control ab-next"
            type="button"
            aria-label="Next moment"
            onClick={() => setActiveIndex((current) => (current + 1) % moments.length)}
          >
            →
          </button>
        </div>

        <div className="ab-occasion-wrap" id="occasions">
          <p>CHOOSE YOUR MOMENT</p>
          <div className="ab-moment-tabs" aria-label="Choose a moment">
            {moments.map((item, index) => (
              <button
                key={item.slug}
                type="button"
                className={index === activeIndex ? "is-active" : undefined}
                aria-pressed={index === activeIndex}
                onClick={() => setActiveIndex(index)}
              >
                <span className="ab-moment-thumb" style={{ backgroundImage: `url("${item.image}")` }} aria-hidden="true" />
                <span className="ab-moment-copy">
                  <strong>{item.label}</strong>
                  <small>{item.question}</small>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="ab-hero-after">
          <p><strong>15 seconds in Times Square.</strong> Verified proof you were there. A keepsake that does not disappear when the screen goes dark.</p>
          <a href={mailto(`My Times Square moment — ${moment.label}`)}>Make it yours</a>
        </div>
      </section>

      <section className="ab-three" id="how" aria-labelledby="how-title">
        <div className="ab-section-copy">
          <p>THE WHOLE IDEA</p>
          <h2 id="how-title">The moment should not end when the screen goes dark.</h2>
        </div>
        <div className="ab-three-grid" id="proof">
          <article>
            <span>01</span>
            <h3>Show it.</h3>
            <p>Your photo, video or message appears in Times Square at the moment you chose.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Prove it.</h3>
            <p>You receive provider-confirmed proof that the creative was displayed.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Keep it.</h3>
            <p>The proof becomes something made to share, revisit and keep after the public moment is over.</p>
          </article>
        </div>
      </section>

      <section className="ab-founder-demo" aria-labelledby="founder-demo-title">
        <div className="ab-founder-copy">
          <p>FOR FOUNDERS, TOO</p>
          <h2 id="founder-demo-title">A launch is simply another moment worth making public.</h2>
          <span>UNIKMO stays here as the working demonstration—not as the hero of your story.</span>
        </div>

        <div className="ab-demo-grid">
          <button className={`ab-bell-card ${ringing ? "is-ringing" : ""}`} onClick={ringDemo} type="button" disabled={ringing}>
            <div className="ab-bell-media">
              <Image
                src="/antibalcony-real-bell.webp"
                alt="The Anti-Balcony ceremonial launch bell"
                fill
                sizes="(max-width: 850px) 100vw, 45vw"
              />
              <span>{ringing ? "RINGING" : recordRevealed ? "RING AGAIN" : "RING IT"}</span>
            </div>
            <div className="ab-demo-caption">
              <small>THE BELL</small>
              <strong>{recordRevealed ? "UNIKMO entered the public record." : "Make the launch feel like an event."}</strong>
            </div>
          </button>

          <div className="ab-proof-card">
            <video autoPlay muted loop playsInline preload="metadata" poster="/antibalcony-nasdaq-unikmo.webp">
              <source src="/antibalcony-nasdaq-unikmo-idle.mp4" type="video/mp4" />
            </video>
            <div className="ab-demo-caption">
              <small>THE PROOF</small>
              <strong>UNIKMO, on the Nasdaq Tower.</strong>
              <Link href="/launches">See public founder launches →</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="ab-offer" id="offer" aria-labelledby="offer-title">
        <div className="ab-section-copy">
          <p>SIMPLE BY DESIGN</p>
          <h2 id="offer-title">Choose how much of the moment you want to keep.</h2>
        </div>
        <div className="ab-offer-list">
          {offers.map((offer) => (
            <article className={offer.featured ? "is-featured" : undefined} key={offer.name}>
              <div>
                <small>{offer.kicker}</small>
                <h3>{offer.name}</h3>
              </div>
              <strong>{offer.price}</strong>
              <p>{offer.text}</p>
              <a href={mailto(offer.subject)}>Choose this</a>
            </article>
          ))}
        </div>
        <p className="ab-offer-note">Placement timing and final creative are confirmed before anything is booked.</p>
      </section>

      <section className="ab-final" aria-labelledby="final-title">
        <p>WORTH REMEMBERING?</p>
        <h2 id="final-title">Then it is worth showing.</h2>
        <a href={mailto("I want my moment in Times Square")}>Tell us your moment</a>
      </section>

      <footer className="ab-footer">
        <div>
          <strong>THE ANTI-BALCONY</strong>
          <span>Times Square moments with proof you can keep.</span>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/launches">Founder launches</Link>
          <Link href="/guides/how-to-launch-a-startup">Launch guides</Link>
          <Link href="/imprint">Imprint</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <a href="mailto:hello@antibalcony.com">Contact</a>
        </nav>
        <span>© {new Date().getFullYear()}</span>
      </footer>
    </main>
  );
}
