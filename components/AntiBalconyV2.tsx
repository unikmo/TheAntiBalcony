"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  { name: "THE RING", price: "$0", label: "PUBLIC LAUNCH", text: "Create the public launch record and share the moment your startup entered the world.", tier: "free" },
  { name: "THE PROOF", price: "$399", label: "TIMES SQUARE", text: "Add a Times Square placement with provider-confirmed screenshot proof.", tier: "snapshot" },
  { name: "THE CLIP", price: "$799", label: "10 / DAY", text: "Turn the placement into a 15-second launch film built to travel across social and investor updates.", tier: "video" },
  { name: "THE MOMENT", price: "$2,999", label: "1 / DAY", text: "A coordinated launch experience with people on the ground, video and press-ready assets.", tier: "takeover" },
  { name: "THE LEGEND", price: "$9,999", label: "1 / WEEK", text: "The full staffed Times Square launch production with professional video and PR workflow.", tier: "vip" },
];

function playBell() {
  const AudioContextClass = window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const ctx = new AudioContextClass();
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.55, now + 0.02);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
  master.connect(ctx.destination);
  [98, 147, 196].forEach((frequency, index) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = index === 0 ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(1 / (index + 1), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(now);
    oscillator.stop(now + 1.9);
  });
  window.setTimeout(() => void ctx.close(), 2100);
}

export function AntiBalconyV2() {
  const router = useRouter();
  const [rings, setRings] = useState<Ring[]>([]);
  const [ringing, setRinging] = useState(false);

  useEffect(() => {
    fetch("/api/rings")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: { rings?: Ring[] }) => setRings(data.rings ?? []))
      .catch(() => setRings([]));
  }, []);

  function startLaunch(tier?: string) {
    setRinging(true);
    playBell();
    const suffix = tier && tier !== "free" ? `?tier=${encodeURIComponent(tier)}` : "";
    window.setTimeout(() => router.push(`/launch${suffix}`), 420);
  }

  return (
    <main className="ab2-shell">
      <header className="ab2-nav">
        <Link className="ab2-brand" href="/">THE ANTI-BALCONY <span>PUBLIC STARTUP-LAUNCH PLATFORM</span></Link>
        <nav>
          <Link href="/launches">LAUNCHES</Link>
          <a href="#how">HOW IT WORKS</a>
          <a href="#packages">PACKAGES</a>
          <Link href="/guides/how-to-launch-a-startup">GUIDES</Link>
        </nav>
        <button onClick={() => startLaunch()}>RING IN YOUR STARTUP</button>
      </header>

      <section className="ab2-hero">
        <div className="ab2-city" aria-hidden="true">
          <div className="ab2-tower ab2-left"><i /><i /><i /></div>
          <div className="ab2-billboard"><small>THE ANTI-BALCONY</small><strong>YOUR STARTUP</strong><span>TIMES SQUARE · NEW YORK</span></div>
          <div className="ab2-tower ab2-right"><i /><i /><i /></div>
          <div className="ab2-street" />
        </div>

        <div className="ab2-hero-copy">
          <p className="ab2-kicker">STEP OUT. RING IN YOUR STARTUP.</p>
          <h1>Launch your<br />startup in public.</h1>
          <p className="ab2-subhead">Create a public Ring for what you built and share the moment your startup entered the world.</p>
          <div className="ab2-actions">
            <button className="ab2-primary" onClick={() => startLaunch()}>RING IN YOUR STARTUP <span>↗</span></button>
            <Link className="ab2-secondary" href="/launches">EXPLORE LAUNCHES</Link>
          </div>
          <p className="ab2-definition"><strong>The Anti-Balcony</strong> is a public startup-launch platform built around a shareable launch ritual called a Ring.</p>
        </div>

        <div className={`ab2-bell-wrap ${ringing ? "is-ringing" : ""}`}>
          <span className="ab2-bell-label">PRESS TO BEGIN</span>
          <button className="ab2-bell" onClick={() => startLaunch()} aria-label="Ring in your startup">
            <span>RING</span>
          </button>
          <div className="ab2-bell-shadow" />
        </div>
      </section>

      <section className="ab2-category" id="how">
        <div>
          <p className="ab2-kicker">A LAUNCH MOMENT, NOT A LAUNCH COMPETITION</p>
          <h2>Your launch should belong to you.</h2>
        </div>
        <p>Product Hunt, LinkedIn, X, Hacker News and your mailing list can distribute a launch. The Anti-Balcony gives the launch itself a permanent public artifact: a Ring you can share before, during or after those channels.</p>
      </section>

      <section className="ab2-how">
        <article><span>01</span><h3>Create the Ring</h3><p>Tell people what you built, who it is for and why it exists.</p></article>
        <article><span>02</span><h3>Make it public</h3><p>Your launch receives a dated public page and a shareable launch artifact.</p></article>
        <article><span>03</span><h3>Share the moment</h3><p>Use the Ring across your launch channels—or take the moment to Times Square.</p></article>
      </section>

      <section className="ab2-packages" id="packages">
        <div className="ab2-section-head">
          <p className="ab2-kicker">FROM PUBLIC RING TO TIMES SQUARE</p>
          <h2>Choose how visible the moment becomes.</h2>
        </div>
        <div className="ab2-package-grid">
          {packages.map((item) => (
            <article key={item.tier} className={item.tier === "video" ? "featured" : item.tier === "vip" ? "elite" : ""}>
              <div><span>{item.label}</span><h3>{item.name}</h3></div>
              <strong>{item.price}</strong>
              <p>{item.text}</p>
              <button onClick={() => startLaunch(item.tier)}>{item.tier === "free" ? "CREATE YOUR RING" : "START YOUR LAUNCH"} <span>↗</span></button>
            </article>
          ))}
        </div>
      </section>

      <section className="ab2-latest">
        <div className="ab2-section-head split">
          <div><p className="ab2-kicker">PUBLIC STARTUP LAUNCHES</p><h2>Recent Rings.</h2></div>
          <Link href="/launches">EXPLORE ALL LAUNCHES ↗</Link>
        </div>
        {rings.length ? (
          <div className="ab2-ring-list">
            {rings.slice(0, 6).map((ring, index) => (
              <Link key={ring.id} href={`/launches/${ring.slug || ring.id}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><h3>{ring.startupName}</h3><p>{ring.tagline || ring.category || "Public startup launch"}</p></div>
                <time>{new Date(ring.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</time>
              </Link>
            ))}
          </div>
        ) : (
          <div className="ab2-empty"><strong>The first public Rings are still open.</strong><p>No invented launches and no fake founder logos. Create the record.</p><button onClick={() => startLaunch()}>RING IN YOUR STARTUP ↗</button></div>
        )}
      </section>

      <section className="ab2-guides">
        <div className="ab2-section-head"><p className="ab2-kicker">LAUNCH BETTER</p><h2>Practical startup-launch guides.</h2></div>
        <div>
          <Link href="/guides/how-to-launch-a-startup"><span>STARTUP LAUNCH</span><strong>How to launch a startup</strong></Link>
          <Link href="/guides/product-launch-checklist"><span>CHECKLIST</span><strong>Product launch checklist</strong></Link>
          <Link href="/guides/build-in-public"><span>BUILD IN PUBLIC</span><strong>Build in public without becoming content</strong></Link>
          <Link href="/guides/product-hunt-alternatives"><span>COMPARISON</span><strong>Product Hunt alternatives</strong></Link>
        </div>
      </section>

      <section className="ab2-final">
        <p className="ab2-kicker">THE INTERNET DOESN’T HAVE A BALCONY</p>
        <h2>Step out.<br />Ring in your startup.</h2>
        <button className="ab2-primary" onClick={() => startLaunch()}>CREATE YOUR PUBLIC RING <span>↗</span></button>
      </section>

      <footer className="ab2-footer">
        <div><strong>THE ANTI-BALCONY</strong><span>Public startup-launch platform</span></div>
        <nav><Link href="/launch">Launch</Link><Link href="/launches">Launches</Link><Link href="/startup-launch">Startup launch</Link><Link href="/guides/how-to-launch-a-startup">Guides</Link></nav>
        <span>© {new Date().getFullYear()}</span>
      </footer>
    </main>
  );
}
