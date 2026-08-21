"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type ProofTier = "snapshot" | "video" | "takeover" | "vip";

type Ring = {
  id: string;
  startupName: string;
  website?: string | null;
  tagline?: string | null;
  createdAt: string;
  tier?: "free" | ProofTier;
  status?: string;
};

type ClaimResult = { ring: Ring; persisted: boolean };

const NAV = [
  ["RITUAL", "#ritual"],
  ["PROOF DROP", "#proof"],
  ["RINGS", "#rings"],
  ["FAQ", "#faq"],
] as const;

const PACKAGES: Array<{
  id: ProofTier;
  name: string;
  price: string;
  label: string;
  includes: string;
  concierge: boolean;
}> = [
  { id: "snapshot", name: "BILLBOARD SCREENSHOT", price: "$399", label: "STATIC PROOF", includes: "Times Square placement + provider-confirmed screenshot + share-ready social post", concierge: false },
  { id: "video", name: "BILLBOARD VIDEO", price: "$799", label: "15-SECOND VIDEO", includes: "Everything in Screenshot + a reusable 15-second Times Square launch clip", concierge: false },
  { id: "takeover", name: "TIMES SQUARE TAKEOVER", price: "$2,999", label: "2 PEOPLE + LIVE", includes: "Billboard + 2 on-site brand ambassadors + live link + edited launch video + BTS + press kit", concierge: true },
  { id: "vip", name: "VIP TAKEOVER", price: "$9,999", label: "5 PEOPLE + PRO CREW", includes: "Takeover + 5 brand ambassadors + professional videographer + up to 60-minute live production window + PR workflow", concierge: true },
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
    () => Array.from({ length: 36 }, (_, index) => ({
      angle: (index / 36) * 360,
      distance: 86 + (index % 6) * 18,
      delay: (index % 9) * 24,
      glyph: index % 3 === 0 ? "+" : index % 3 === 1 ? "•" : "×",
    })),
    [],
  );

  function ringBell() {
    if (phase !== "idle") return;
    setPhase("ringing");
    setFormError("");
    setCheckoutError("");
    playBell();
    if (navigator.vibrate) navigator.vibrate([80, 45, 130]);
    window.setTimeout(() => setPhase("claim"), 1450);
  }

  function closeModal() {
    setPhase("idle");
    setRing(null);
    setCheckoutError("");
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
      <div className="noise" aria-hidden="true" />
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="The Anti-Balcony home"><span className="slash">/</span>THE ANTI-BALCONY</a>
        <nav aria-label="Main navigation">{NAV.map(([label, href]) => <a key={href} href={href}>{label}</a>)}</nav>
        <span className="live-chip"><i /> INTERNET OPEN</span>
      </header>

      <section className="hero" id="top">
        <div className="hero-kicker">NYSE HAS A BALCONY. THE INTERNET HAS THIS.</div>
        <h1>RING THE<br /><span>INTERNET BELL.</span></h1>
        <p className="hero-copy">A launch ritual for startups that would rather make noise than ask permission.</p>

        <div className={`bell-stage ${phase === "ringing" ? "is-ringing" : ""}`} id="ritual">
          <div className="orbit orbit-one" aria-hidden="true" />
          <div className="orbit orbit-two" aria-hidden="true" />
          <div className="crosshair horizontal" aria-hidden="true" />
          <div className="crosshair vertical" aria-hidden="true" />
          {phase === "ringing" && burst.map((piece, index) => (
            <span key={index} className="burst" aria-hidden="true" style={{
              "--angle": `${piece.angle}deg`,
              "--distance": `${piece.distance}px`,
              "--delay": `${piece.delay}ms`,
            } as React.CSSProperties}>{piece.glyph}</span>
          ))}
          <button className="bell-button" onClick={ringBell} disabled={phase !== "idle"} aria-label="Ring the Internet Bell">
            <span className="button-top">RING</span><span className="button-bottom">THE BELL</span>
          </button>
          <span className="bell-instruction">NO IPO. NO INVITE. PRESS IT.</span>
        </div>

        <div className="manifesto-line" aria-label="Brand manifesto">
          <span>01 / SHOW UP</span><b>→</b><span>02 / MAKE NOISE</span><b>→</b><span>03 / LEAVE PROOF</span>
        </div>
      </section>

      <section className="split-section" id="proof">
        <div className="section-number">02</div>
        <div><span className="eyebrow">THE PROOF DROP</span><h2>FROM BROWSER TAB<br />TO <em>TIMES SQUARE.</em></h2></div>
        <div className="proof-copy">
          <p>Start with proof. Upgrade to presence. The premium packages put real human energy into the square while your launch is on-screen.</p>
          <div className="proof-grid">
            {PACKAGES.map((item) => (
              <div key={item.id}><strong>{item.price}</strong><span>{item.name}<br />{item.label}</span></div>
            ))}
          </div>
          <p><strong>THE PRODUCT CHANGES AT $2,999.</strong> Below it, you buy media proof. Above it, you buy a coordinated launch moment with people, screen, stream and reusable content.</p>
          <a className="text-cta" href="#ritual">RING FIRST <span>↗</span></a>
        </div>
      </section>

      <section className="rings-section" id="rings">
        <div className="section-heading">
          <div><span className="eyebrow">PUBLIC SIGNAL</span><h2>LATEST RINGS</h2></div>
          <span className="counter">{rings.length.toString().padStart(2, "0")} ON SCREEN</span>
        </div>
        <div className="rings-grid">
          {rings.length === 0 ? (
            <div className="empty-ring"><span>00</span><p>No claimed rings yet. The first one gets the cleanest timestamp.</p></div>
          ) : rings.map((item, index) => {
            const hasProof = item.status === "live" || item.status === "proof_ready";
            return (
              <article className="ring-card" key={item.id}>
                <span className="ring-index">{String(index + 1).padStart(2, "0")}</span>
                <div><h3>{item.startupName}</h3><p>{item.tagline || "RANG THE INTERNET BELL"}</p></div>
                <time dateTime={item.createdAt}>{formatRingTime(item.createdAt)}</time>
                <span className={`status ${hasProof ? "live" : ""}`}>{item.status === "proof_ready" ? "PROOF READY" : item.status === "live" ? "LIVE" : item.status === "ops_review" ? "OPS REVIEW" : "RUNG"}</span>
              </article>
            );
          })}
        </div>
      </section>

      <section className="anti-section">
        <p className="giant-quote">“THE BALCONY<br />WAS ALWAYS<br />A METAPHOR.”</p>
        <div className="anti-copy">
          <span className="eyebrow">WHY THIS EXISTS</span>
          <p>Old launch rituals were designed to signal that a small room had approved of you. This one is designed for builders, customers, communities and the people watching from everywhere else.</p>
          <p className="pink">STATUS SHOULD BE PARTICIPATORY.</p>
        </div>
      </section>

      <section className="faq" id="faq">
        <span className="eyebrow">NO FINE PRINT ENERGY</span>
        <h2>QUESTIONS.</h2>
        <details><summary>Is the digital bell actually free?<span>+</span></summary><p>Yes. Ringing and claiming a public timestamp costs nothing.</p></details>
        <details><summary>What does $399 include?<span>+</span></summary><p>A real Times Square placement, provider-confirmed screenshot proof and a share-ready social post.</p></details>
        <details><summary>Why is the $799 tier different?<span>+</span></summary><p>It adds a 15-second video clip—the reusable launch asset for LinkedIn, X, press outreach and investor updates.</p></details>
        <details><summary>What makes the $2,999 Takeover different?<span>+</span></summary><p>It adds physical presence: two on-site brand ambassadors, coordinated branding, live-link capability, edited video, behind-the-scenes assets and a press kit. Because people are physically involved, the booking enters operations review before it is called scheduled.</p></details>
        <details><summary>What does VIP add at $9,999?<span>+</span></summary><p>Five on-site brand ambassadors, a professional videographer, an extended live-production window, premium edit, press assets and a PR-distribution workflow.</p></details>
        <details><summary>Why does a Takeover need operations review?<span>+</span></summary><p>Times Square filming and branded public-space activity can involve MOME, CECM/SAPO, insurance, location rules and talent releases depending on the exact setup. We confirm those requirements before scheduling the physical event.</p></details>
        <details><summary>Do you promise “live” before the screen is confirmed?<span>+</span></summary><p>No. Media status and physical operations status are independently verified. The interface only says live after provider confirmation.</p></details>
      </section>

      <footer>
        <a className="wordmark footer-mark" href="#top"><span className="slash">/</span>THE ANTI-BALCONY</a>
        <p>BUILT FOR STARTUPS WITH MORE INTERNET THAN INSTITUTION.</p>
        <span>© {new Date().getFullYear()} / ALL SIGNAL, NO BALCONY.</span>
      </footer>

      {(phase === "claim" || phase === "claimed") && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}>
          <div className="claim-modal" role="dialog" aria-modal="true" aria-labelledby="claim-title" tabIndex={-1} ref={modalRef}>
            <button className="modal-close" onClick={closeModal} aria-label="Close">×</button>
            {phase === "claim" ? (
              <>
                <span className="modal-code">SIGNAL / 001</span>
                <h2 id="claim-title">THE BELL<br /><em>HEARD YOU.</em></h2>
                <p>Claim the timestamp. Put a name on the noise.</p>
                <form onSubmit={claimRing}>
                  <label>STARTUP NAME<input autoFocus value={startupName} onChange={(e) => setStartupName(e.target.value)} placeholder="YOUR COMPANY" maxLength={80} /></label>
                  <label>WEBSITE <small>OPTIONAL</small><input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" inputMode="url" /></label>
                  <label>ONE-LINE SIGNAL <small>OPTIONAL</small><input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="WHAT JUST ARRIVED?" maxLength={120} /></label>
                  {formError && <p className="form-error" role="alert">{formError}</p>}
                  <button className="claim-submit" disabled={isSubmitting}>{isSubmitting ? "STAMPING…" : "CLAIM THIS RING →"}</button>
                </form>
              </>
            ) : (
              <>
                <span className="modal-code">TIMESTAMP CLAIMED</span>
                <h2 id="claim-title">YOU<br /><em>RANG IT.</em></h2>
                <p><strong>{ring?.startupName}</strong> is now part of the public signal.</p>
                {!persisted && <p className="demo-warning">Firebase credentials are not connected yet, so this ring is visible in this session only.</p>}
                <div className="claimed-actions">
                  <button onClick={shareRing}>SHARE THE RING ↗</button>
                  <div className="upgrade-box">
                    <span>TAKE IT OFF-SCREEN</span>
                    <strong>CHOOSE YOUR LAUNCH MOMENT</strong>
                    <p>Digital proof can move directly into fulfillment. Physical Takeovers enter operations review before a date is confirmed.</p>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="FOUNDER@STARTUP.COM" aria-label="Email for paid launch package" />
                    <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 12 }}>
                      <input type="checkbox" checked={allowSocial} onChange={(e) => setAllowSocial(e.target.checked)} style={{ width: 16, marginTop: 2 }} />
                      Publish confirmed proof through The Anti-Balcony social workflow.
                    </label>
                    <div className="proof-grid package-grid">
                      {PACKAGES.map((item) => (
                        <div key={item.id}>
                          <span>{item.label}</span>
                          <strong>{item.price}</strong>
                          <span>{item.includes}</span>
                          {item.concierge && <span>CONCIERGE / DATE CONFIRMED AFTER OPS REVIEW</span>}
                          <button className="paid-button" onClick={() => startPaidCheckout(item.id)}>{item.concierge ? "RESERVE" : "CHOOSE"} {item.name} →</button>
                        </div>
                      ))}
                    </div>
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
