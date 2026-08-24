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
  {
    name: "THE RING",
    price: "$0",
    label: "PUBLIC LAUNCH",
    text: "A dated public launch page and shareable Ring for the startup you built.",
    tier: "free",
  },
  {
    name: "THE PROOF",
    price: "$399",
    label: "TIMES SQUARE",
    text: "Your Ring extended into a Times Square placement with provider-confirmed screenshot proof.",
    tier: "snapshot",
  },
  {
    name: "THE CLIP",
    price: "$799",
    label: "LAUNCH FILM",
    text: "A 15-second launch film built from the placement for social posts, updates and pitch follow-ups.",
    tier: "video",
  },
  {
    name: "THE MOMENT",
    price: "$2,999",
    label: "COORDINATED LAUNCH",
    text: "A coordinated launch experience with people on the ground, video and press-ready assets.",
    tier: "takeover",
  },
  {
    name: "THE LEGEND",
    price: "$9,999",
    label: "FULL PRODUCTION",
    text: "The staffed Times Square launch production with professional video and PR workflow.",
    tier: "vip",
  },
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

  useEffect(() => {
    fetch("/api/rings")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { rings?: Ring[] }) => setRings(data.rings ?? []))
      .catch(() => setRings([]));
  }, []);

  function startLaunch(tier?: string) {
    setRinging(true);
    playBell();
    const suffix = tier && tier !== "free" ? `?tier=${encodeURIComponent(tier)}` : "";
    window.setTimeout(() => router.push(`/launch${suffix}`), 300);
  }

  return (
    <main className="de-shell">
      <header className="de-header">
        <div className="de-container de-header-inner">
          <Link className="de-brand" href="/" aria-label="The Anti-Balcony home">
            <span className="de-brand-mark" aria-hidden="true" />
            THE ANTI-BALCONY
          </Link>

          <nav aria-label="Primary navigation">
            <Link href="/launches">Launches</Link>
            <a href="#how">How it works</a>
            <a href="#packages">Packages</a>
            <Link href="/guides/how-to-launch-a-startup">Guides</Link>
          </nav>

          <button className="de-header-cta" onClick={() => startLaunch()}>
            Create your Ring
          </button>
        </div>
      </header>

      <section className="de-hero" aria-labelledby="home-title">
        <div className="de-container de-hero-grid">
          <div>
            <p className="de-eyebrow">Step out. Ring in your startup.</p>
            <h1 id="home-title">Launch your startup in public.</h1>
            <p className="de-hero-copy">
              Create a dated public Ring for what you built, then share that launch artifact everywhere your audience already is.
              When the moment deserves more visibility, take the same launch to Times Square.
            </p>

            <div className="de-actions">
              <button className="de-primary" onClick={() => startLaunch()}>
                Create your Ring
              </button>
              <Link className="de-secondary" href="/launches">
                Explore launches
              </Link>
            </div>

            <ul className="de-facts" aria-label="Ring benefits">
              <li>Free public launch record</li>
              <li>Dated, shareable page</li>
              <li>No ranking required</li>
            </ul>
          </div>

          <aside className={`de-proof ${ringing ? "is-ringing" : ""}`} aria-label="Example public Ring">
            <div className="de-proof-head">
              <span>Public Ring</span>
              <span className="de-proof-live">Ready to launch</span>
            </div>

            <div className="de-proof-main">
              <span className="de-proof-label">Startup</span>
              <strong>YOUR STARTUP</strong>
              <p>A permanent public artifact for the moment your startup entered the world.</p>
            </div>

            <div className="de-proof-meta">
              <div>
                <span>Record</span>
                <strong>Public launch page</strong>
              </div>
              <div>
                <span>Distribution</span>
                <strong>Share anywhere</strong>
              </div>
            </div>

            <button className="de-ring-button" onClick={() => startLaunch()} aria-label="Create your public Ring">
              Ring
            </button>
          </aside>
        </div>
      </section>

      <section className="de-principle">
        <div className="de-container de-principle-grid">
          <div>
            <p className="de-eyebrow">A launch moment, not a launch competition</p>
            <h2>Your launch should belong to you.</h2>
          </div>

          <div className="de-principle-copy">
            <p>
              Product Hunt, LinkedIn, X, Hacker News and your mailing list can distribute a launch. The Anti-Balcony gives the
              launch itself a permanent artifact: a Ring you can point people to before, during and after launch day.
            </p>
            <div className="de-channel-row" aria-label="Compatible launch channels">
              <span>Product Hunt</span>
              <span>LinkedIn</span>
              <span>X</span>
              <span>Hacker News</span>
              <span>Email</span>
            </div>
          </div>
        </div>
      </section>

      <section className="de-how" id="how" aria-labelledby="how-title">
        <div className="de-container">
          <div className="de-section-head">
            <p className="de-eyebrow">How it works</p>
            <h2 id="how-title">Three steps. One public moment.</h2>
            <p>The core journey stays deliberately simple so the startup—not the platform—remains the focus.</p>
          </div>

          <div className="de-steps">
            <article className="de-step">
              <span className="de-step-number">01</span>
              <h3>Create the Ring</h3>
              <p>Tell people what you built, who it is for and why it exists.</p>
            </article>
            <article className="de-step">
              <span className="de-step-number">02</span>
              <h3>Make it public</h3>
              <p>Your startup gets a dated public launch page designed to be understood and shared quickly.</p>
            </article>
            <article className="de-step">
              <span className="de-step-number">03</span>
              <h3>Extend the moment</h3>
              <p>Share the Ring across your channels—or add Times Square, video and launch-production upgrades.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="de-packages" id="packages" aria-labelledby="packages-title">
        <div className="de-container">
          <div className="de-section-head">
            <p className="de-eyebrow">From public Ring to Times Square</p>
            <h2 id="packages-title">Choose how visible the moment becomes.</h2>
            <p>Start free. Upgrade only when the launch needs a larger public artifact or production layer.</p>
          </div>

          <div className="de-package-list">
            {packages.map((item) => (
              <article key={item.tier} className={`de-package ${item.tier === "video" ? "is-featured" : ""}`}>
                <div>
                  <span className="de-package-kicker">{item.label}</span>
                  <h3>{item.name}</h3>
                </div>
                <strong className="de-package-price">{item.price}</strong>
                <p>{item.text}</p>
                <button onClick={() => startLaunch(item.tier)}>
                  {item.tier === "free" ? "Create Ring" : "Start launch"}
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="de-rings" aria-labelledby="rings-title">
        <div className="de-container">
          <div className="de-section-head-row">
            <div className="de-section-head">
              <p className="de-eyebrow">Public startup launches</p>
              <h2 id="rings-title">Recent Rings.</h2>
            </div>
            <Link className="de-text-link" href="/launches">
              Explore all launches →
            </Link>
          </div>

          {rings.length ? (
            <div className="de-ring-list">
              {rings.slice(0, 6).map((ring, index) => (
                <Link key={ring.id} href={`/launches/${ring.slug || ring.id}`}>
                  <span className="de-ring-index">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{ring.startupName}</h3>
                    <p>{ring.tagline || ring.category || "Public startup launch"}</p>
                  </div>
                  <time>{formatRingDate(ring.createdAt)}</time>
                </Link>
              ))}
            </div>
          ) : (
            <div className="de-empty">
              <strong>The first public Rings are still open.</strong>
              <p>No invented launches and no fake founder logos. The record begins when a real startup creates it.</p>
              <button onClick={() => startLaunch()}>Create your Ring</button>
            </div>
          )}
        </div>
      </section>

      <section className="de-guides" aria-labelledby="guides-title">
        <div className="de-container">
          <div className="de-section-head">
            <p className="de-eyebrow">Launch better</p>
            <h2 id="guides-title">Practical startup-launch guides.</h2>
          </div>

          <div className="de-guide-list">
            <Link href="/guides/how-to-launch-a-startup">
              <span>Startup launch</span>
              <strong>How to launch a startup</strong>
            </Link>
            <Link href="/guides/product-launch-checklist">
              <span>Checklist</span>
              <strong>Product launch checklist</strong>
            </Link>
            <Link href="/guides/build-in-public">
              <span>Build in public</span>
              <strong>Build in public without becoming content</strong>
            </Link>
            <Link href="/guides/product-hunt-alternatives">
              <span>Comparison</span>
              <strong>Product Hunt alternatives</strong>
            </Link>
          </div>
        </div>
      </section>

      <section className="de-final" aria-labelledby="final-title">
        <div className="de-container">
          <p className="de-eyebrow">The internet doesn&apos;t have a balcony</p>
          <h2 id="final-title">Step out. Ring in your startup.</h2>
          <p>Create the public record first. Decide how big the moment becomes after that.</p>
          <button className="de-primary" onClick={() => startLaunch()}>
            Create your public Ring
          </button>
        </div>
      </section>

      <footer className="de-footer">
        <div className="de-container de-footer-inner">
          <div className="de-footer-brand">
            <strong>THE ANTI-BALCONY</strong>
            <span>Public startup-launch platform</span>
          </div>
          <nav aria-label="Footer navigation">
            <Link href="/launch">Launch</Link>
            <Link href="/launches">Launches</Link>
            <Link href="/startup-launch">Startup launch</Link>
            <Link href="/guides/how-to-launch-a-startup">Guides</Link>
          </nav>
          <span className="de-footer-copy">© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </main>
  );
}
