"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { FormEvent, useState } from "react";

const PackageRequestForm = dynamic(
  () => import("@/components/PackageRequestForm").then((module) => module.PackageRequestForm),
  { loading: () => <p className="launch-help">Preparing the private upload…</p> },
);

type Tier = "snapshot" | "video" | "takeover" | "vip";

type CreatedRing = {
  id: string;
  slug: string;
  startupName: string;
  indexable: boolean;
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
  const [selectedTier, setSelectedTier] = useState<Tier | null>(
    PAID.some((item) => item.tier === initialTier) ? initialTier as Tier : null,
  );

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

  if (ring) {
    return (
      <section className="launch-success">
        <p className="seo-breadcrumb">Your Ring exists</p>
        <h2>{ring.startupName} has entered the public record.</h2>
        <p data-testid="ring-index-status">
          {ring.indexable
            ? "This Ring contains enough detail to be eligible for search indexing."
            : "This Ring is public but remains noindex until the profile is complete enough to be useful as a search result."}
        </p>
        {!persisted && <p className="launch-error">Supabase is not connected in this environment, so this Ring is only a session response and will not persist.</p>}
        {persisted && <p><Link href={`/launches/${ring.slug}`}>View and share your public Ring</Link></p>}

        <div className="seo-section launch-upgrade">
          <h2>Take the moment further</h2>
          <div>
            <p>Choose a package, upload the moment, and request a NASDAQ Tower window. Availability and creative approval come before payment.</p>
            <div className="upgrade-inline">
              {PAID.map((item) => (
                <button type="button" key={item.tier} onClick={() => setSelectedTier(item.tier)} className={selectedTier === item.tier ? "is-selected" : undefined}>
                  <span>{item.name}</span><strong>{item.price}</strong>
                </button>
              ))}
            </div>
            {selectedTier && <PackageRequestForm ringId={ring.id} startupName={ring.startupName} tier={selectedTier} />}
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
      <label className="launch-consent full"><input name="legalConsent" type="checkbox" required /><span>I confirm I am authorized to publish this information, accept the <Link href="/terms">Terms</Link>, and acknowledge the <Link href="/privacy">Privacy Notice</Link>.</span></label>
      <p className="launch-help">The public Ring is free. Rich profiles can become indexable startup-launch pages. Thin Rings remain public but noindex so the directory does not fill with low-value pages.</p>
      {error && <p className="launch-error" role="alert">{error}</p>}
      <button className="launch-submit" disabled={loading}>{loading ? "CREATING THE RING…" : "RING IN YOUR STARTUP"}</button>
    </form>
  );
}
