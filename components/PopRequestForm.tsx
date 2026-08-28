"use client";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { EXTRA_CARD_CENTS, MAX_CARDS, OCCASIONS, POP_CHOICES, POP_OFFERS, isPopOffer, money, quotePop, type PopOffer } from "@/lib/pop-offers";

export function PopRequestForm({ initialOffer = "free" }: { initialOffer?: PopOffer }) {
  const [offer, setOffer] = useState<PopOffer>(initialOffer);
  const [cards, setCards] = useState("1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ reference: string; offer: PopOffer } | null>(null);
  const key = useRef<string | null>(null);
  const pending = useRef(false);
  const totalCards = offer === "free" ? 0 : Number(cards);
  const validCards = offer === "free" || (Number.isInteger(totalCards) && totalCards >= 1 && totalCards <= MAX_CARDS);
  const quote = validCards ? quotePop(offer, totalCards) : null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || !quote) return;
    pending.current = true;
    setBusy(true); setError("");
    const data = new FormData(event.currentTarget);
    key.current ??= crypto.randomUUID();
    try {
      const response = await fetch("/api/pop", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        submissionKey: key.current, offer, totalCards, title: data.get("title"), email: data.get("email"),
        occasion: data.get("occasion"), celebration: data.get("celebration"), momentDate: data.get("momentDate"),
        sourceUrl: data.get("sourceUrl") || null, rightsAccepted: data.get("rightsAccepted") === "on",
        privacyAcknowledged: data.get("privacyAcknowledged") === "on", publicConsent: data.get("publicConsent") === "on",
        featureConsent: data.get("featureConsent") === "on", capturePendingAccepted: data.get("capturePendingAccepted") === "on", website: data.get("website"),
      }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "We could not save your request. Please try again.");
      setResult({ reference: payload.reference, offer });
    } catch (err) { setError(err instanceof Error ? err.message : "Please try again."); }
    finally { pending.current = false; setBusy(false); }
  }

  if (result) return <section className="pop-success" role="status"><p className="pop-eyebrow">Request saved</p><h2>{result.offer === "free" ? "Your POP is in review." : "Your moment starts here."}</h2>
    <p>Reference: <code>{result.reference}</code></p><p>{result.offer === "free" ? "We’ll review your public link before publishing a moment page. A social feature is optional and not guaranteed." : result.offer === "nasdaq" ? "We’ll review the date, screen and licensed capture before confirming a quote. No booking or payment has been made." : "We’ll review your footage and card quantity, then confirm the scope, tax and delivery before payment. No payment has been made."}</p>
    <p className="pop-note">Keep this reference. If you need to follow up, contact hello@antibalcony.com. This confirmation does not mean an email has been sent.</p><Link className="pop-button" href="/capture-guide">Get ready for your POP ↗</Link>
  </section>;

  return <form className="pop-form" onSubmit={submit} onChange={() => { if (!pending.current) key.current = null; }}>
    <label>Choose your experience<select name="offer" value={offer} disabled={busy} onChange={(e) => { if (isPopOffer(e.target.value)) setOffer(e.target.value); }}>
      <option value="free">POP — free</option><option value="keep">Keep it — $199 + tax & delivery</option><option value="nasdaq">Times Square · NASDAQ — $549 + tax & delivery · request only</option>
    </select></label>
    {offer === "nasdaq" && <p className="pop-alert">Capture arrangements are being confirmed. This is an enquiry—not a reservation. We will not take payment or book a screen from this form.</p>}
    <div className="pop-fields"><label>Your moment<input name="title" required minLength={2} maxLength={100} placeholder="Our first big win. Maya’s graduation." disabled={busy} /></label>
      <label>Your email<input name="email" type="email" autoComplete="email" required maxLength={254} disabled={busy} /><small>For your request. Never shown on the public page.</small></label></div>
    <div className="pop-fields"><label>The occasion<select name="occasion" required defaultValue="" disabled={busy}><option value="" disabled>Choose an occasion</option>{OCCASIONS.map(v => <option key={v}>{v}</option>)}</select></label>
      <label>What’s your POP?<select name="celebration" required defaultValue="" disabled={busy}><option value="" disabled>You choose the celebration</option>{POP_CHOICES.map(v => <option key={v}>{v}</option>)}</select></label></div>
    <label>Occasion date<input name="momentDate" type="date" required disabled={busy} /><small>{offer === "nasdaq" ? "Not a confirmed screen date or time. Scheduling is agreed separately in New York local time." : "Past and future celebrations are welcome."}</small></label>
    <label>{offer === "free" ? "Your public video link" : "Your footage link (optional for now)"}<input key={offer === "free" ? "public" : "private"} name="sourceUrl" type="url" required={offer === "free"} maxLength={2000} placeholder="https://…" disabled={busy} />
      <small>{offer === "free" ? "Instagram, YouTube, LinkedIn, Vimeo, TikTok or Facebook. It must be publicly viewable. We save the link, not the video." : "A share link to your footage. No upload at this stage. Your POP footage need not be 15 seconds; we prepare any screen creative separately."}</small></label>
    {offer !== "free" && <><label>Total UNIKMO cards<input name="totalCards" type="number" value={cards} min={1} max={MAX_CARDS} step={1} required disabled={busy} onChange={(e) => setCards(e.target.value)} /><small>One included. Each extra same-memory card is {money(EXTRA_CARD_CENTS)}. One design and one delivery address.</small></label>
      <div className="pop-summary" aria-live="polite">{quote ? <><dl><dt>{POP_OFFERS[offer].name} · one card</dt><dd>{money(quote.baseCents)}</dd><dt>{quote.extraCards} extra cards</dt><dd>{money(quote.extraCents)}</dd><dt>Estimated subtotal</dt><dd><strong>{money(quote.subtotalCents)}</strong></dd></dl><p className="pop-note">USD. Applicable tax and delivery are additional and confirmed before payment. No charge is made here.</p></> : <p>Enter 1–{MAX_CARDS} total cards.</p>}</div></>}
    <label className="pop-check"><input type="checkbox" name="rightsAccepted" required disabled={busy} />I have permission to share this footage and the people, music and logos in it.</label>
    {offer === "free" && <label className="pop-check"><input name="publicConsent" type="checkbox" required disabled={busy} />Publish my moment title, occasion, date and video link on a public page after review.</label>}
    <label className="pop-check"><input type="checkbox" name="featureConsent" disabled={busy} />You may consider my moment for a social feature. Optional; we’ll confirm any reuse details first.</label>
    {offer === "nasdaq" && <label className="pop-check"><input type="checkbox" name="capturePendingAccepted" required disabled={busy} />I understand that screen availability, creative approval and licensed capture must be confirmed before booking.</label>}
    <label className="pop-check"><input type="checkbox" name="privacyAcknowledged" required disabled={busy} /><span>I’ve read the <Link href="/privacy">privacy notice</Link>. My request will be reviewed before any purchase agreement.</span></label>
    <label className="pop-honeypot" aria-hidden="true">Leave empty<input name="website" tabIndex={-1} autoComplete="off" /></label>
    {error && <p role="alert" className="pop-alert">{error}</p>}
    <button className="pop-button" type="submit" disabled={busy || !validCards}>{busy ? "Saving your request…" : offer === "free" ? "Submit your POP for review" : "Send your request"}</button>
  </form>;
}
