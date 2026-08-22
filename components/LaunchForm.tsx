"use client";

import { FormEvent, useState } from "react";

type Tier = "snapshot" | "video" | "takeover" | "vip";

type CreatedRing = {
  id: string;
  slug: string;
  startupName: string;
};

const PAID: { tier: Tier; name: string; price: string }[] = [
  { tier: "snapshot", name: "THE PROOF", price: "$399" },
  { tier: "video", name: "THE CLIP", price: "$799" },
  { tier: "takeover", name: "THE MOMENT", price: "$2,999" },
  { tier: "vip", name: "THE LEGEND", price: "$9,999" },
];

export function LaunchForm({ initialTier }: { initialTier?: string }) {
  const [ring, setRing] = useState<CreatedRing | null>(null);
  const [persisted, setPersisted] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [allowSocial, setAllowSocial] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const response = await fetch("/api/rings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json() as { ring?: CreatedRing; persisted?: boolean; error?: string };
      if (!response.ok || !data.ring) throw new Error(data.error || "Could not create this Ring.");
      setRing(data.ring);
      setPersisted(Boolean(data.persisted));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create this Ring.");
    } finally {
      setLoading(false);
    }
  }

  async function checkout(tier: Tier) {
    if (!ring) return;
    if (!email.trim()) {
      setCheckoutError("Add an email for delivery before choosing a paid package.");
      return;
    }
    setCheckoutError("");
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ringId: ring.id, startupName: ring.startupName, email, tier, allowSocial }),
    });
    const data = await response.json() as { url?: string; error?: string };
    if (!response.ok || !data.url) {
      setCheckoutError(data.error || "Checkout is not configured yet.");
      return;
    }
    window.location.assign(data.url);
  }

  if (ring) {
    const selected = PAID.find((item) => item.tier === initialTier);
    return (
      <section className="launch-success">
        <p className="ab2-kicker">YOUR RING EXISTS</p>
        <h2>{ring.startupName} has entered the public record.</h2>
        <p>The public Ring page now verifies whether the profile is complete enough for search indexing. Thin profiles remain noindex automatically.</p>
        {!persisted && <p className="launch-error">Firebase is not connected in this environment, so this Ring is only a session response and will not persist.</p>}
        {persisted && <p><a href={`/launches/${ring.slug}`}>VIEW AND SHARE YOUR PUBLIC RING ↗</a></p>}

        <div className="seo-section" style={{ marginTop: 35 }}>
          <h2>Take the moment further</h2>
          <div>
            <p>Add Times Square proof without changing what the Ring is: your permanent public launch artifact.</p>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="founder@startup.com" aria-label="Email for launch package delivery" />
            <label style={{ display: "block", marginTop: 14, color: "#b8c7da", fontSize: 12 }}>
              <input type="checkbox" checked={allowSocial} onChange={(event) => setAllowSocial(event.target.checked)} /> Publish confirmed proof through The Anti-Balcony social workflow.
            </label>
            <div className="upgrade-inline">
              {PAID.map((item) => (
                <button key={item.tier} onClick={() => checkout(item.tier)} style={selected?.tier === item.tier ? { outline: "1px solid #8db7e3" } : undefined}>
                  <span>{item.name}</span><strong>{item.price}</strong>
                </button>
              ))}
            </div>
            {checkoutError && <p className="launch-error">{checkoutError}</p>}
          </div>
        </div>
      </section>
    );
  }

  return (
    <form className="launch-form-grid" onSubmit={submit}>
      <label>STARTUP NAME<input name="startupName" required minLength={2} maxLength={80} placeholder="Your startup" /></label>
      <label>CATEGORY<select name="category" defaultValue="SaaS"><option>SaaS</option><option>App</option><option>AI</option><option>Marketplace</option><option>Consumer</option><option>Fintech</option><option>Developer tool</option><option>Other</option></select></label>
      <label className="full">ONE-LINE LAUNCH SIGNAL<input name="tagline" maxLength={120} placeholder="What changed today?" /></label>
      <label>WEBSITE<input name="website" type="url" placeholder="https://yourstartup.com" /></label>
      <label>SOCIAL LINK<input name="socialUrl" type="url" placeholder="https://linkedin.com/..." /></label>
      <label className="full">WHAT DOES THE STARTUP DO?<textarea name="whatItDoes" maxLength={240} placeholder="Explain the product in plain language." /></label>
      <label className="full">WHO IS IT FOR?<input name="intendedCustomer" maxLength={160} placeholder="The customer or user this is built for" /></label>
      <label>FOUNDER OR TEAM<input name="founder" maxLength={120} placeholder="Founder or team name" /></label>
      <label>PRODUCT IMAGE URL<input name="imageUrl" type="url" placeholder="https://.../product-screenshot.jpg" /></label>
      <label className="full">WHAT PROBLEM ARE YOU SOLVING?<textarea name="problem" maxLength={320} placeholder="The problem before your startup exists." /></label>
      <label className="full">SHORT FOUNDER STORY<textarea name="story" maxLength={1000} placeholder="Why did you build this, and why now?" /></label>
      <p className="launch-help">The public Ring is free. Rich profiles can become indexable startup-launch pages. Thin Rings remain public but noindex so the directory does not fill with low-value pages.</p>
      {error && <p className="launch-error" role="alert">{error}</p>}
      <button className="launch-submit" disabled={loading}>{loading ? "CREATING THE RING…" : "RING IN YOUR STARTUP →"}</button>
    </form>
  );
}
