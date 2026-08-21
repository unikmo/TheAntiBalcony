"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type ProofTier = "snapshot" | "video" | "takeover" | "vip";
type PricingTier = "free" | ProofTier;

type Ring = {
  id: string;
  startupName: string;
  website?: string | null;
  tagline?: string | null;
  createdAt: string;
  tier?: PricingTier;
  status?: string;
};

type ClaimResult = { ring: Ring; persisted: boolean };

type Package = {
  id: PricingTier;
  name: string;
  price: string;
  scarcity: string;
  kicker: string;
  description: string;
  includes: string[];
  featured?: boolean;
  elite?: boolean;
};

const NAV = [
  ["HOW IT WORKS", "#how"],
  ["PACKAGES", "#packages"],
  ["RINGS", "#rings"],
  ["FAQ", "#faq"],
] as const;

const PACKAGES: Package[] = [
  {
    id: "free",
    name: "THE RING",
    price: "$0",
    scarcity: "UNLIMITED",
    kicker: "DIGITAL CEREMONY",
    description: "Claim the moment. Ring the Internet Bell and create a public launch timestamp.",
    includes: ["Digital bell ceremony", "Public ring timestamp", "Share-ready launch post"],
  },
  {
    id: "snapshot",
    name: "THE PROOF",
    price: "$399",
    scarcity: "UNLIMITED",
    kicker: "TIMES SQUARE SCREENSHOT",
    description: "Move the launch from your browser to a real Times Square screen and leave proof behind.",
    includes: ["Times Square placement", "Provider-confirmed screenshot", "Share-ready social asset"],
  },
  {
    id: "video",
    name: "THE CLIP",
    price: "$799",
    scarcity: "10 / DAY",
    kicker: "15-SECOND LAUNCH FILM",
    description: "Turn the placement into a reusable launch asset built for LinkedIn, X, press and investor updates.",
    includes: ["Everything in The Proof", "15-second Times Square video", "Social-ready launch edit"],
    featured: true,
  },
  {
    id: "takeover",
    name: "THE MOMENT",
    price: "$2,999",
    scarcity: "1 / DAY",
    kicker: "TIMES SQUARE TAKEOVER",
    description: "A coordinated launch moment with people on the ground while your startup owns the screen.",
    includes: ["2 on-site brand ambassadors", "Live-link capability", "Edited launch video", "BTS + press kit"],
  },
  {
    id: "vip",
    name: "THE LEGEND",
    price: "$9,999",
    scarcity: "1 / WEEK",
    kicker: "ELITE TAKEOVER",
    description: "The full launch ritual: crew, camera, live production, PR workflow and homepage feature.",
    includes: ["5 brand ambassadors", "Professional videographer", "Up to 60-minute production window", "PR workflow + homepage feature"],
    elite: true,
  },
];

function playBell() {
  const AudioContextClass = window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  const ctx = new AudioContextClass();
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.72, now + 0.025);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);
  master.connect(ctx.destination);

  [82.4, 123.5, 164.8, 247].forEach((frequency, index) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = index === 0 ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.985, now + 1.6);
    gain.gain.setValueAtTime(1 / (index + 1), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2 - index * 0.22);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(now);
    oscillator.stop(now + 2.5);
  });

  window.setTimeout(() => void ctx.close(), 2800);
}

function formatRingTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "JUST NOW";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date).toUpperCase();
}

function statusLabel(status?: string) {
  if (status === "proof_ready") return "PROOF READY";
  if (status === "live") return "LIVE";
  if (status === "scheduled") return "SCHEDULED";
  if (status === "ops_review") return "OPS REVIEW";
  return "RUNG";
}

export function AntiBalcony() {
  const [phase, setPhase] = useState<"idle" | "ringing" | "claim" | "claimed">("idle");
  const [rings, setRings] = useState<Ring[]>([]);
  const [startupName, setStartupName] = useState("");
  const [website, setWebsite] = useState("");
  const [tagline, setTagline] = useState("");
  const [email, setEmail] = useState("");
  const [ring, setRing] = useState<Ring | null>(null);
  const [persisted, setPersisted] = useState(true);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [allowSocial, setAllowSocial] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/rings")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("rings unavailable")))
      .then((data: { rings?: Ring[] }) => setRings(data.rings ?? []))
      .catch(() => setRings([]));
  }, []);

  useEffect(() => {
    if (phase !== "claim" && phase !== "claimed") return;
    modalRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [phase]);

  const burst = useMemo(
    () => Array.from({ length: 28 }, (_, index) => ({
      angle: (index / 28) * 360,
      distance: 88 + (index % 5) * 22,
      delay: (index % 7) * 22,
      glyph: index % 2 === 0 ? "+" : "•",
    })),
    [],
  );

  const latestRing = rings[0];

  function ringBell() {
    if (phase !== "idle") return;
    setPhase("ringing");
    setFormError("");
    setCheckoutError("");
    playBell();
    if (navigator.vibrate) navigator.vibrate([80, 45, 130]);
    window.setTimeout(() => setPhase("claim"), 1150);
  }

  function closeModal() {
    setPhase("idle");
    setRing(null);
    setCheckoutError("");
  }

  function ringFromPackage() {
    document.getElementById("ritual")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function claimRing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (startupName.trim().length < 2) {
      setFormError("Give the ring a startup name first.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");
    try {
      const response = await fetch("/api/rings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startupName, website, tagline }),
      });
      const data = (await response.json()) as ClaimResult & { error?: string };
      if (!response.ok || !data.ring) throw new Error(data.error || "Could not claim this ring.");
      setRing(data.ring);
      setPersisted(data.persisted);
      setRings((current) => [data.ring, ...current.filter((item) => item.id !== data.ring.id)].slice(0, 12));
      setPhase("claimed");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not claim this ring.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function shareRing() {
    if (!ring) return;
    const text = `We just rang The Anti-Balcony. ${ring.startupName} has arrived. #InternetBell`;
    const url = `${window.location.origin}/?ring=${encodeURIComponent(ring.id)}`;
    if (navigator.share) {
      await navigator.share({ title: `${ring.startupName} rang the Internet Bell`, text, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(`${text} ${url}`);
    setCheckoutError("Share copy copied to clipboard.");
  }

  async function startPaidCheckout(tier: ProofTier) {
    if (!ring) return;
    if (!email.trim()) {
      setCheckoutError("Add an email so we can deliver the launch package.");
      return;
    }

    setCheckoutError("");
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ringId: ring.id, startupName: ring.startupName, email, tier, allowSocial }),
    });
    const data = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !data.url) {
      setCheckoutError(data.error || "Paid checkout is not configured yet.");
      return;
    }
    window.location.assign(data.url);
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="The Anti-Balcony home">
          <span className="mark">/</span><span>THE ANTI-BALCONY</span>
        </a>
        <nav aria-label="Main navigation">
          {NAV.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
        </nav>
        <a className="header-cta" href="#ritual">RING THE BELL</a>
      </header>

      <section className="hero" id="top">
        <div className="hero-ambient hero-ambient-one" />
        <div className="hero-ambient hero-ambient-two" />
        <div className="hero-content">
          <div className="hero-copy-block">
            <span className="eyebrow"><i /> THE LAUNCH RITUAL FOR THE INTERNET</span>
            <h1>RING THE<br /><span>INTERNET BELL.</span></h1>
            <p className="hero-subtitle">The anti-elitist launch ritual for startups that don’t need Wall Street.</p>
            <div className="hero-actions">
              <button className="primary-cta" onClick={ringBell} disabled={phase !== "idle"}>RING THE BELL <b>↗</b></button>
              <a className="secondary-cta" href="#packages">SEE THE PACKAGES</a>
            </div>
            <div className="hero-trust">
              <span><strong>$0</strong> to ring</span>
              <span><strong>Times Square</strong> from $399</span>
              <span><strong>1/week</strong> Elite slot</span>
            </div>
          </div>

          <div className="hero-stage" aria-label="Times Square launch preview">
            <div className="stage-glass">
              <div className="stage-toolbar"><span>LIVE LAUNCH PREVIEW</span><b>● SIGNAL READY</b></div>
              <div className="times-square-scene">
                <div className="city-column city-left"><i /><i /><i /><i /></div>
                <div className="city-column city-right"><i /><i /><i /></div>
                <div className="billboard">
                  <span className="billboard-label">THE ANTI-BALCONY PRESENTS</span>
                  <strong>{latestRing?.startupName || "YOUR STARTUP"}</strong>
                  <em>{latestRing?.tagline || "JUST RANG THE INTERNET BELL"}</em>
                  <div className="billboard-pulse"><i /> TIMES SQUARE</div>
                </div>
                <div className="street-glow" />
              </div>
              <div className="stage-caption">
                <div><span>LATEST SIGNAL</span><strong>{latestRing?.startupName || "OPEN SLOT"}</strong></div>
                <div><span>STATUS</span><strong>{latestRing ? statusLabel(latestRing.status) : "READY"}</strong></div>
              </div>
            </div>
          </div>
        </div>

        <div className={`ceremony-dock ${phase === "ringing" ? "is-ringing" : ""}`} id="ritual">
          {phase === "ringing" && burst.map((piece, index) => (
            <span key={index} className="burst" aria-hidden="true" style={{
              "--angle": `${piece.angle}deg`,
              "--distance": `${piece.distance}px`,
              "--delay": `${piece.delay}ms`,
            } as React.CSSProperties}>{piece.glyph}</span>
          ))}
          <div className="ceremony-orbit" />
          <button className="ceremony-button" onClick={ringBell} disabled={phase !== "idle"} aria-label="Ring the Internet Bell">
            <span>RING</span><small>THE BELL</small>
          </button>
          <p>NO IPO. NO INVITE. JUST PRESS IT.</p>
        </div>
      </section>

      <section className="moment-section" id="how">
        <div className="section-heading centered">
          <span className="eyebrow">FROM CLICK TO CULTURAL MOMENT</span>
          <h2>YOU RING HERE.<br /><span>THE WORLD SEES IT THERE.</span></h2>
          <p>One ritual, five levels of proof. Start digital. Scale all the way to a coordinated Times Square launch production.</p>
        </div>
        <div className="moment-flow">
          <article><span>01</span><div className="flow-icon">●</div><h3>RING</h3><p>Create the public launch timestamp.</p></article>
          <article><span>02</span><div className="flow-icon">▰</div><h3>LIGHT UP</h3><p>Move the signal onto a Times Square screen.</p></article>
          <article><span>03</span><div className="flow-icon">▶</div><h3>LEAVE PROOF</h3><p>Receive the screenshot, film, stream or full launch package.</p></article>
        </div>
      </section>

      <section className="packages-section" id="packages">
        <div className="section-heading split-heading">
          <div>
            <span className="eyebrow">CHOOSE HOW LOUD</span>
            <h2>FIVE WAYS TO<br /><span>MAKE ARRIVAL VISIBLE.</span></h2>
          </div>
          <p>Below $2,999, you buy media proof. At $2,999 and above, The Anti-Balcony becomes a coordinated launch experience with real people, production and scarcity.</p>
        </div>

        <div className="package-grid">
          {PACKAGES.map((item) => (
            <article key={item.id} className={`package-card ${item.featured ? "featured" : ""} ${item.elite ? "elite" : ""}`}>
              <div className="package-topline">
                <span>{item.kicker}</span>
                <b>{item.scarcity}</b>
              </div>
              <h3>{item.name}</h3>
              <div className="package-price">{item.price}</div>
              <p>{item.description}</p>
              <ul>{item.includes.map((line) => <li key={line}><i>✓</i>{line}</li>)}</ul>
              {item.id === "free" ? (
                <button onClick={ringBell}>RING FOR FREE <span>↗</span></button>
              ) : (
                <button onClick={ringFromPackage}>{item.elite ? "APPLY FOR ELITE" : "RING TO RESERVE"} <span>↗</span></button>
              )}
              {item.featured && <div className="package-badge">MOST USEFUL LAUNCH ASSET</div>}
              {item.elite && <div className="elite-glow" />}
            </article>
          ))}
        </div>
      </section>

      <section className="elite-feature">
        <div className="elite-copy">
          <span className="eyebrow">THE ELITE TAKEOVER</span>
          <h2>ONE STARTUP.<br />ONE WEEK.<br /><span>ONE SQUARE.</span></h2>
          <p>This is not a billboard package. It is a launch production built around scarcity, presence and a piece of media your team can keep using long after the screen goes dark.</p>
          <div className="elite-meta"><span>5 PEOPLE</span><span>PRO VIDEO</span><span>LIVE PRODUCTION</span><span>PR WORKFLOW</span></div>
          <button className="primary-cta" onClick={ringFromPackage}>START WITH THE BELL <b>↗</b></button>
        </div>
        <div className="elite-visual">
          <div className="elite-frame">
            <div className="elite-screen"><span>THIS WEEK’S</span><strong>ELITE TAKEOVER</strong><em>Reserved for the next launch worth remembering.</em></div>
            <div className="crew-row"><i /><i /><i /><i /><i /></div>
            <div className="camera-tag">REC ● 4K / TIMES SQUARE</div>
          </div>
        </div>
      </section>

      <section className="proof-stack">
        <div className="section-heading centered compact">
          <span className="eyebrow">BUILT TO BECOME SOCIAL PROOF</span>
          <h2>THE SCREEN IS THE MOMENT.<br /><span>THE ASSET IS WHAT TRAVELS.</span></h2>
        </div>
        <div className="proof-assets">
          <article className="proof-asset screenshot-asset"><div className="asset-window"><span>PROVIDER CONFIRMED</span><strong>YOUR STARTUP<br />IN TIMES SQUARE</strong></div><h3>THE SCREENSHOT</h3><p>A clean proof asset for launch-day social and investor updates.</p></article>
          <article className="proof-asset video-asset"><div className="asset-phone"><span>00:15</span><strong>YOUR<br />LAUNCH<br />FILM</strong><i>▶</i></div><h3>THE CLIP</h3><p>Fast, vertical-friendly footage designed to be reposted.</p></article>
          <article className="proof-asset press-asset"><div className="asset-document"><span>PRESS KIT</span><strong>THE STORY<br />BEHIND THE<br />MOMENT.</strong><i>PDF + COPY + MEDIA</i></div><h3>THE PRESS PACKAGE</h3><p>Messaging and media packaged for outreach, not buried in a folder.</p></article>
        </div>
      </section>

      <section className="rings-section" id="rings">
        <div className="section-heading rings-heading">
          <div><span className="eyebrow">PUBLIC SIGNAL</span><h2>THE RING BOARD.</h2></div>
          <span className="ring-count">{rings.length.toString().padStart(2, "0")} LIVE RECORDS</span>
        </div>
        {rings.length === 0 ? (
          <div className="rings-empty">
            <div><span>01</span><strong>OPEN</strong><p>The first public ring owns the first line.</p></div>
            <div><span>02</span><strong>OPEN</strong><p>No fabricated logos. No fake social proof.</p></div>
            <div><span>03</span><strong>OPEN</strong><p>Ring it and become the record.</p></div>
          </div>
        ) : (
          <div className="rings-list">
            {rings.slice(0, 8).map((item, index) => (
              <article key={item.id}>
                <span className="ring-rank">#{String(index + 1).padStart(2, "0")}</span>
                <div><h3>{item.startupName}</h3><p>{item.tagline || "RANG THE INTERNET BELL"}</p></div>
                <time>{formatRingTime(item.createdAt)}</time>
                <span className={`ring-status ${item.status === "live" || item.status === "proof_ready" ? "active" : ""}`}>{statusLabel(item.status)}</span>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="faq" id="faq">
        <div className="faq-intro"><span className="eyebrow">THE USEFUL QUESTIONS</span><h2>BEFORE YOU<br />PRESS IT.</h2><p>The ritual is playful. The fulfillment is not. Paid placements only become “live” after provider confirmation, and physical Takeovers pass operations review before scheduling.</p></div>
        <div className="faq-list">
          <details><summary>Is the digital bell actually free?<span>+</span></summary><p>Yes. Ringing and claiming a public timestamp costs nothing.</p></details>
          <details><summary>What does $399 include?<span>+</span></summary><p>A real Times Square placement, provider-confirmed screenshot proof and a share-ready social asset.</p></details>
          <details><summary>Why is the $799 tier the default upgrade?<span>+</span></summary><p>Because the 15-second video is a reusable launch asset rather than a one-time proof image.</p></details>
          <details><summary>What changes at $2,999?<span>+</span></summary><p>People enter the experience: two on-site brand ambassadors, coordinated branding, live-link capability, an edited launch video, BTS assets and press material.</p></details>
          <details><summary>Why is Elite limited to one per week?<span>+</span></summary><p>The $9,999 package is a staffed production with five ambassadors, professional video, an extended production window, PR workflow and a homepage feature. Scarcity protects execution quality.</p></details>
          <details><summary>Do you claim a billboard is live before confirmation?<span>+</span></summary><p>No. The interface only marks placements live after provider confirmation. Physical Takeovers also require operations clearance before scheduling.</p></details>
        </div>
      </section>

      <section className="final-cta">
        <span className="eyebrow">THE INTERNET DOESN’T HAVE A BALCONY</span>
        <h2>SO WE BUILT<br /><span>A BELL.</span></h2>
        <p>Your launch can stay in a tab, or it can become a moment people remember.</p>
        <button className="primary-cta large" onClick={ringBell}>RING THE INTERNET BELL <b>↗</b></button>
      </section>

      <footer>
        <a className="wordmark" href="#top"><span className="mark">/</span><span>THE ANTI-BALCONY</span></a>
        <p>BUILT FOR STARTUPS WITH MORE INTERNET THAN INSTITUTION.</p>
        <div><a href="#faq">FAQ</a><span>© {new Date().getFullYear()}</span></div>
      </footer>

      {(phase === "claim" || phase === "claimed") && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}>
          <div className="claim-modal" role="dialog" aria-modal="true" aria-labelledby="claim-title" tabIndex={-1} ref={modalRef}>
            <button className="modal-close" onClick={closeModal} aria-label="Close">×</button>
            {phase === "claim" ? (
              <>
                <span className="modal-kicker">THE BELL HEARD YOU</span>
                <h2 id="claim-title">CLAIM THE<br /><span>MOMENT.</span></h2>
                <p>Put a name on the ring. The public timestamp is free.</p>
                <form onSubmit={claimRing}>
                  <label>STARTUP NAME<input autoFocus value={startupName} onChange={(e) => setStartupName(e.target.value)} placeholder="Your startup" maxLength={80} /></label>
                  <label>WEBSITE <small>OPTIONAL</small><input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" inputMode="url" /></label>
                  <label>ONE-LINE SIGNAL <small>OPTIONAL</small><input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="What just launched?" maxLength={120} /></label>
                  {formError && <p className="form-error" role="alert">{formError}</p>}
                  <button className="claim-submit" disabled={isSubmitting}>{isSubmitting ? "STAMPING THE MOMENT…" : "CLAIM THIS RING →"}</button>
                </form>
              </>
            ) : (
              <>
                <span className="modal-kicker">PUBLIC TIMESTAMP CLAIMED</span>
                <h2 id="claim-title">YOU<br /><span>RANG IT.</span></h2>
                <p><strong>{ring?.startupName}</strong> is now part of the public signal.</p>
                {!persisted && <p className="demo-warning">Firebase credentials are not connected yet, so this ring is visible in this session only.</p>}
                <button className="share-button" onClick={shareRing}>SHARE THE RING ↗</button>
                <div className="upgrade-panel">
                  <div className="upgrade-heading"><span>TAKE IT TO TIMES SQUARE</span><strong>CHOOSE THE PROOF.</strong></div>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="founder@startup.com" aria-label="Email for paid launch package" />
                  <label className="consent-row"><input type="checkbox" checked={allowSocial} onChange={(e) => setAllowSocial(e.target.checked)} /> Publish confirmed proof through The Anti-Balcony social workflow.</label>
                  <div className="upgrade-grid">
                    {PACKAGES.filter((item): item is Package & { id: ProofTier } => item.id !== "free").map((item) => (
                      <button key={item.id} onClick={() => startPaidCheckout(item.id)}>
                        <span>{item.name}</span><strong>{item.price}</strong><small>{item.scarcity}</small>
                      </button>
                    ))}
                  </div>
                </div>
                {checkoutError && <p className="checkout-note" role="status">{checkoutError}</p>}
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
