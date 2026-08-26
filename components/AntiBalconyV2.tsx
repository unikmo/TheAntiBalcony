"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Ring = {
  id: string;
  slug: string;
  startupName: string;
  tagline?: string | null;
  category?: string | null;
  createdAt: string;
  status?: string;
};

const packages = [
  { name: "THE RING", price: "$0", label: "PUBLIC LAUNCH", text: "A dated public launch page and shareable Ring for the startup you built.", tier: "free" },
  { name: "THE PROOF", price: "$399", label: "TIMES SQUARE", text: "Your Ring extended into a Times Square placement with provider-confirmed screenshot proof.", tier: "snapshot" },
  { name: "THE CLIP", price: "$799", label: "LAUNCH FILM", text: "A 15-second launch film built from the placement for social posts, updates and pitch follow-ups.", tier: "video" },
  { name: "THE MOMENT", price: "$2,999", label: "COORDINATED LAUNCH", text: "A coordinated launch experience with people on the ground, video and press-ready assets.", tier: "takeover" },
  { name: "THE LEGEND", price: "$9,999", label: "FULL PRODUCTION", text: "The staffed Times Square launch production with professional video and PR workflow.", tier: "vip" },
];

function playBell() {
  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  const ctx = new AudioContextClass();
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.42, now + 0.02);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 1.45);
  master.connect(ctx.destination);

  [110, 165, 220].forEach((frequency, index) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = index === 0 ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(1 / (index + 1), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(now);
    oscillator.stop(now + 1.55);
  });

  window.setTimeout(() => void ctx.close(), 1700);
}

function formatRingDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Public launch";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function AntiBalconyV2() {
  const router = useRouter();
  const [rings, setRings] = useState<Ring[]>([]);
  const [ringing, setRinging] = useState(false);
  const [activeMoment, setActiveMoment] = useState<"founder" | "record" | "times-square">("founder");
  const [timesSquarePlaying, setTimesSquarePlaying] = useState(false);
  const [displaySeconds, setDisplaySeconds] = useState(15);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bellTimerRef = useRef<number | null>(null);

  useEffect(() => {
    fetch("/api/rings")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { rings?: Ring[] }) => setRings(data.rings ?? []))
      .catch(() => setRings([]));

    return () => {
      if (bellTimerRef.current) window.clearTimeout(bellTimerRef.current);
    };
  }, []);

  function stopTimesSquareDemo() {
    videoRef.current?.pause();
    setTimesSquarePlaying(false);
    setDisplaySeconds(15);
  }

  function showFounderDemo() {
    stopTimesSquareDemo();
    setActiveMoment("founder");
  }

  function ringUnikmoDemo() {
    stopTimesSquareDemo();
    setActiveMoment("record");
    setRinging(false);
    window.requestAnimationFrame(() => setRinging(true));
    playBell();
    if (bellTimerRef.current) window.clearTimeout(bellTimerRef.current);
    bellTimerRef.current = window.setTimeout(() => setRinging(false), 1000);
  }

  function playTimesSquareDemo() {
    stopTimesSquareDemo();
    setActiveMoment("times-square");
    setTimesSquarePlaying(true);
    setDisplaySeconds(15);

    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      void video.play();
    }
  }

  function syncTimesSquareTimer() {
    const elapsed = videoRef.current?.currentTime ?? 0;
    setDisplaySeconds(Number(Math.max(0, 15 - elapsed).toFixed(1)));
  }

  function completeTimesSquareDemo() {
    setDisplaySeconds(0);
    setTimesSquarePlaying(false);
  }

  function startLaunch(tier?: string) {
    setRinging(true);
    playBell();
    const suffix = tier && tier !== "free" ? `?tier=${encodeURIComponent(tier)}` : "";
    window.setTimeout(() => router.push(`/launch${suffix}`), 420);
  }

  return (
    <main className="de-shell">
      <header className="de-header">
        <div className="de-container de-header-inner" style={{ justifyContent: "center" }}>
          <Link className="de-brand" href="/" aria-label="The Anti-Balcony home">
            <span className="de-brand-mark" aria-hidden="true" />
            THE ANTI-BALCONY
          </Link>
        </div>
      </header>

      <section className="cinema-hero" aria-labelledby="home-title">
        <div className="record-hero-title"><h1 id="home-title">Your launch deserves a public record.</h1></div>
        <div className="visible-moments" aria-label="Interactive UNIKMO founder, bell and Times Square demonstration">
          <article className={`visible-moment founder-moment ${activeMoment === "founder" ? "is-active" : ""}`}>
            <button type="button" className="moment-button" onClick={showFounderDemo} aria-pressed={activeMoment === "founder"} aria-label="Show UNIKMO founder launch example">
              <span className="moment-media founder-media">
                <Image src="/antibalcony-founder-launch.webp" alt="A founder preparing the UNIKMO launch" fill priority sizes="(max-width: 850px) 100vw, 33vw" />
                <span className="moment-status"><b>UNIKMO.COM</b><small>READY TO RING</small></span>
              </span>
              <span className="moment-caption"><small>01 · FOUNDER</small><strong>UNIKMO is ready to enter the public record.</strong><em>Click to restart the demonstration</em></span>
            </button>
          </article>

          <article className={`visible-moment bell-moment ${activeMoment !== "founder" ? "has-record" : ""}`}>
            <button type="button" className="moment-button" onClick={ringUnikmoDemo} aria-pressed={activeMoment === "record"} aria-label="Ring the bell for UNIKMO and reveal its public record">
              <span className={`moment-media bell-demo-visual ${ringing ? "is-ringing" : ""}`}>
                <Image src="/antibalcony-real-bell.webp" alt="A polished coral-red ceremonial launch bell" fill priority sizes="(max-width: 850px) 100vw, 33vw" />
                <span className="bell-prompt"><b>{activeMoment === "founder" ? "RING THE BELL" : "RING AGAIN"}</b><small>Click the bell</small></span>
                <span className="bell-wave wave-one" aria-hidden="true" />
                <span className="bell-wave wave-two" aria-hidden="true" />
                <span className="public-record-demo" role="status" aria-live="polite">
                  <small>FOUNDER-INITIATED · DEMONSTRATION RECORD</small>
                  <strong>UNIKMO</strong>
                  <p>Some moments deserve more than a message.</p>
                  <span><b>UNIKMO.COM</b><b>RUNG · 26 AUG 2026</b></span>
                </span>
              </span>
              <span className="moment-caption"><small>02 · BELL</small><strong>{activeMoment === "founder" ? "Ring it to see what becomes public." : "UNIKMO now has a dated public launch record."}</strong><em>No order or submission is created</em></span>
            </button>
          </article>

          <article className={`visible-moment times-square-moment ${activeMoment === "times-square" ? "is-active" : ""}`}>
            <button type="button" className="moment-button" onClick={playTimesSquareDemo} aria-pressed={activeMoment === "times-square"} aria-label="Play the UNIKMO Times Square display for 15 seconds">
              <span className="moment-media times-square-media">
                <video className="times-square-idle" autoPlay muted loop playsInline preload="metadata" poster="/antibalcony-times-square.webp" aria-label="Animated giant Times Square launch screen"><source src="/antibalcony-times-square-loop-lite.mp4" type="video/mp4" /></video>
                <video ref={videoRef} className="times-square-proof" muted playsInline preload="metadata" poster="/antibalcony-times-square-proof-preview.webp" aria-label="Fifteen-second proof preview of the UNIKMO launch on a giant Times Square screen" onTimeUpdate={syncTimesSquareTimer} onEnded={completeTimesSquareDemo}><source src="/antibalcony-times-square-proof-preview.mp4" type="video/mp4" /></video>
                <span className="times-square-screen"><small>THE ANTI-BALCONY PRESENTS</small><strong>UNIKMO</strong><b>SOME MOMENTS DESERVE MORE THAN A MESSAGE.</b></span>
                <span className="proof-metadata"><b><i /> PROOF PREVIEW</b><small>TIMES SQUARE · NEW YORK</small><small>PLACEMENT SOURCE · ADOMNI (PLANNED)</small><small>CAPTURE · LICENSED FIELD CAMERA</small></span>
                <span className="display-timer" aria-live="polite"><b>{timesSquarePlaying ? `${displaySeconds.toFixed(1)}s` : displaySeconds === 0 ? "15s COMPLETE" : "PLAY 15s"}</b><small>{timesSquarePlaying ? "LIVE DISPLAY" : displaySeconds === 0 ? "DISPLAY PROOF" : "CLICK TIMES SQUARE"}</small></span>
                <span className="display-progress" aria-hidden="true"><i style={{ transform: `scaleX(${timesSquarePlaying ? (15 - displaySeconds) / 15 : displaySeconds === 0 ? 1 : 0})` }} /></span>
              </span>
              <span className="moment-caption"><small>03 · TIMES SQUARE</small><strong>{timesSquarePlaying ? "UNIKMO is live for 15 seconds." : displaySeconds === 0 ? "The 15-second launch display is complete." : "See the same launch on a real-world stage."}</strong><em>Click to play the timed display</em></span>
            </button>
          </article>
        </div>
      </section>

      <section className="de-principle">
        <div className="de-container" style={{ maxWidth: 900, textAlign: "center" }}>
          <p className="de-eyebrow" style={{ justifyContent: "center" }}>One launch. One public moment.</p>
          <h2>Your launch should belong to you.</h2>
          <div className="de-principle-copy" style={{ maxWidth: 720, margin: "30px auto 0" }}>
            <p>Other channels can distribute the news. The Anti-Balcony gives the launch itself a permanent artifact: one Ring you can point people to before, during and after launch day.</p>
          </div>
        </div>
      </section>

      <section className="de-how" id="how" aria-labelledby="how-title">
        <div className="de-container">
          <div className="de-section-head" style={{ textAlign: "center", marginInline: "auto" }}>
            <p className="de-eyebrow" style={{ justifyContent: "center" }}>How it works</p>
            <h2 id="how-title">Three steps. One public moment.</h2>
            <p>The startup stays in focus from first Ring to final proof.</p>
          </div>
          <div className="de-steps" style={{ gridTemplateColumns: "1fr", maxWidth: 900, marginInline: "auto" }}>
            <article className="de-step"><span className="de-step-number">01</span><h3>Create the Ring</h3><p>Tell people what you built, who it is for and why it exists.</p></article>
            <article className="de-step"><span className="de-step-number">02</span><h3>Make it public</h3><p>Your startup gets a dated public launch page designed to be understood and shared quickly.</p></article>
            <article className="de-step"><span className="de-step-number">03</span><h3>Extend the moment</h3><p>Keep the Ring digital or extend the same launch into Times Square, film and production.</p></article>
          </div>
        </div>
      </section>

      <section className="de-packages" id="packages" aria-labelledby="packages-title">
        <div className="de-container">
          <div className="de-section-head" style={{ textAlign: "center", marginInline: "auto" }}>
            <p className="de-eyebrow" style={{ justifyContent: "center" }}>From Ring to Times Square</p>
            <h2 id="packages-title">Choose how big the moment becomes.</h2>
            <p>Start free. Add visibility only when the launch needs it.</p>
          </div>
          <div className="de-package-list">
            {packages.map((item) => (
              <article key={item.tier} className={`de-package ${item.tier === "video" ? "is-featured" : ""}`}>
                <div><span className="de-package-kicker">{item.label}</span><h3>{item.name}</h3></div>
                <strong className="de-package-price">{item.price}</strong>
                <p>{item.text}</p>
                <button onClick={() => startLaunch(item.tier)}>{item.tier === "free" ? "Create your Ring" : "Start your launch"}</button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="de-rings" aria-labelledby="rings-title">
        <div className="de-container">
          <div className="de-section-head-row">
            <div className="de-section-head"><p className="de-eyebrow">Public startup launches</p><h2 id="rings-title">Recent Rings.</h2></div>
            <Link className="de-text-link" href="/launches">Explore all launches →</Link>
          </div>
          {rings.length ? (
            <div className="de-ring-list">
              {rings.slice(0, 6).map((ring, index) => (
                <Link key={ring.id} href={`/launches/${ring.slug || ring.id}`}>
                  <span className="de-ring-index">{String(index + 1).padStart(2, "0")}</span>
                  <div><h3>{ring.startupName}</h3><p>{ring.tagline || ring.category || "Public startup launch"}</p></div>
                  <time>{formatRingDate(ring.createdAt)}</time>
                </Link>
              ))}
            </div>
          ) : (
            <div className="de-empty"><strong>The first public Rings are still open.</strong><p>No invented launches and no fake founder logos. The record begins when a real startup creates it.</p><button onClick={() => startLaunch()}>Create your Ring</button></div>
          )}
        </div>
      </section>

      <section className="de-guides" aria-labelledby="guides-title">
        <div className="de-container">
          <div className="de-section-head"><p className="de-eyebrow">Launch better</p><h2 id="guides-title">Practical startup-launch guides.</h2></div>
          <div className="de-guide-list">
            <Link href="/guides/how-to-launch-a-startup"><span>Startup launch</span><strong>How to launch a startup</strong></Link>
            <Link href="/guides/product-launch-checklist"><span>Checklist</span><strong>Product launch checklist</strong></Link>
            <Link href="/guides/build-in-public"><span>Build in public</span><strong>Build in public without becoming content</strong></Link>
            <Link href="/guides/product-hunt-alternatives"><span>Comparison</span><strong>Product Hunt alternatives</strong></Link>
          </div>
        </div>
      </section>

      <section className="de-final" aria-labelledby="final-title">
        <div className="de-container">
          <p className="de-eyebrow">The internet doesn&apos;t have a balcony</p>
          <h2 id="final-title">Step out. Ring in your startup.</h2>
          <p>Create the public record first. Decide how big the moment becomes after that.</p>
          <button className="de-primary" onClick={() => startLaunch()}>Create your public Ring</button>
        </div>
      </section>

      <footer className="de-footer">
        <div className="de-container de-footer-inner">
          <div className="de-footer-brand"><strong>THE ANTI-BALCONY</strong><span>Public startup-launch platform</span></div>
          <nav aria-label="Footer navigation"><Link href="/launch">Launch</Link><Link href="/launches">Launches</Link><Link href="/startup-launch">How it works</Link><Link href="/guides/how-to-launch-a-startup">Guides</Link><Link href="/imprint">Imprint</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><a href="mailto:hello@antibalcony.com">Contact</a></nav>
          <span className="de-footer-copy">© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </main>
  );
}
