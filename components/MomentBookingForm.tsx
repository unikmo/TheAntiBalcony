"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

type WindowCode = "08-12" | "12-16" | "16-20" | "20-24";
type Tier = "snapshot" | "video" | "takeover";

type BookingResult = {
  orderId: string;
  orderRef: string;
  accessToken: string;
  status: string;
  checkoutReady: boolean;
  preferredWindowLabel: string;
  backupWindowLabel: string | null;
};

const OCCASIONS = [
  "Proposal",
  "Wedding",
  "Birthday",
  "Baby shower",
  "I love you",
  "Our memories",
  "Anniversary",
  "Graduation",
  "Big win",
  "Launch",
];

const WINDOWS: { value: WindowCode; label: string }[] = [
  { value: "08-12", label: "8 AM–12 PM ET" },
  { value: "12-16", label: "12 PM–4 PM ET" },
  { value: "16-20", label: "4 PM–8 PM ET" },
  { value: "20-24", label: "8 PM–12 AM ET" },
];

const PACKAGES: { tier: Tier; name: string; price: string; detail: string }[] = [
  { tier: "snapshot", name: "Show It", price: "$399", detail: "Times Square display + verified proof" },
  { tier: "video", name: "Show + Keep", price: "$799", detail: "Display + proof + 15-second keepsake film" },
  { tier: "takeover", name: "The Moment", price: "$2,999", detail: "Coordinated experience + complete proof package" },
];

function tomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

async function inspectCreative(file: File) {
  const url = URL.createObjectURL(file);
  try {
    if (file.type.startsWith("image/")) {
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
        image.onerror = () => reject(new Error("Could not read this image."));
        image.src = url;
      });
      return { ...dimensions, durationSeconds: null as number | null };
    }

    if (file.type.startsWith("video/")) {
      return await new Promise<{ width: number; height: number; durationSeconds: number }>((resolve, reject) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => resolve({
          width: video.videoWidth,
          height: video.videoHeight,
          durationSeconds: video.duration,
        });
        video.onerror = () => reject(new Error("Could not read this video."));
        video.src = url;
      });
    }

    throw new Error("Use a photo or 15-second video.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function jsonPost<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

export function MomentBookingForm({
  initialTier = "video",
  initialOccasion = "Proposal",
  checkout,
  orderRef,
}: {
  initialTier?: Tier;
  initialOccasion?: string;
  checkout?: string;
  orderRef?: string;
}) {
  const [tier, setTier] = useState<Tier>(initialTier);
  const [occasion, setOccasion] = useState(OCCASIONS.includes(initialOccasion) ? initialOccasion : "Proposal");
  const [preferredWindow, setPreferredWindow] = useState<WindowCode>("16-20");
  const [backupWindow, setBackupWindow] = useState<WindowCode | "">("20-24");
  const [anyTimeSameDay, setAnyTimeSameDay] = useState(true);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [phase, setPhase] = useState<"idle" | "saving" | "uploading" | "reviewing" | "checkout" | "pending">("idle");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const minDate = useMemo(tomorrow, []);

  if (checkout === "reserved") {
    return (
      <section className="booking-result booking-result-success">
        <p className="booking-eyebrow">PAYMENT RECEIVED</p>
        <h2>Your Pop Moment is moving.</h2>
        <p>
          Payment was received for <strong>{orderRef || "your booking"}</strong>. We are now securing the best eligible Times Square placement on your selected date, using your preferred four-hour window, backup window and same-day flexibility where you allowed it.
        </p>
        <p>If an exceptional provider or inventory issue makes fulfillment impossible, the booking is automatically refunded in full.</p>
        <Link href="/">Back to The Pop Moment</Link>
      </section>
    );
  }

  if (checkout === "cancelled") {
    return (
      <section className="booking-result">
        <p className="booking-eyebrow">NO CHARGE</p>
        <h2>Your payment was not completed.</h2>
        <p>Your saved booking has not been charged. You can restart payment whenever you are ready.</p>
        <Link href="/book">Return to booking</Link>
      </section>
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const form = new FormData(event.currentTarget);
    const creative = form.get("creative");
    if (!(creative instanceof File) || !creative.size) {
      setError("Add the photo or 15-second video you want us to place.");
      return;
    }
    if (!legalAccepted) {
      setError("Accept the booking and content-rights terms before continuing.");
      return;
    }

    try {
      setPhase("saving");
      setMessage("Saving your date, window preferences and same-day flexibility…");
      const booking = await jsonPost<BookingResult>("/api/orders", {
        customerName: String(form.get("customerName") || ""),
        email: String(form.get("email") || ""),
        occasion,
        tier,
        eventDate: String(form.get("eventDate") || ""),
        preferredWindow,
        backupWindow: backupWindow || null,
        anyTimeSameDay,
        creativeMessage: String(form.get("creativeMessage") || ""),
        legalAccepted,
        board: "times_square_flexible",
      });

      const details = await inspectCreative(creative);
      setPhase("uploading");
      setMessage("Validating and uploading your creative securely…");
      const upload = await jsonPost<{ signedUrl: string; path: string }>("/api/orders/creative-upload-intent", {
        orderId: booking.orderId,
        accessToken: booking.accessToken,
        filename: creative.name,
        contentType: creative.type,
        sizeBytes: creative.size,
        width: details.width,
        height: details.height,
        durationSeconds: details.durationSeconds,
      });

      const uploadResponse = await fetch(upload.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": creative.type },
        body: creative,
      });
      if (!uploadResponse.ok) throw new Error("Your creative could not be uploaded. Please try again.");

      setPhase("reviewing");
      setMessage("Running the final technical check before secure payment…");
      const review = await jsonPost<{ status: string; reviewStatus: string; checkoutReady: boolean; notes?: string | null }>("/api/orders/creative-upload-complete", {
        orderId: booking.orderId,
        accessToken: booking.accessToken,
      });

      if (review.reviewStatus === "needs_changes") {
        setPhase("pending");
        setMessage(review.notes || "The creative needs a change before payment. You have not been charged.");
        return;
      }

      if (!review.checkoutReady) {
        setPhase("pending");
        setMessage(`Request ${booking.orderRef} is saved, but the file needs manual review before payment. You have not been charged.`);
        return;
      }

      setPhase("checkout");
      setMessage("Your file is ready. Opening secure Stripe payment…");
      const checkoutData = await jsonPost<{ url: string }>("/api/checkout", { orderId: booking.orderId });
      window.location.assign(checkoutData.url);
    } catch (err) {
      setPhase("idle");
      setError(err instanceof Error ? err.message : "Could not prepare this booking.");
    }
  }

  const working = phase !== "idle" && phase !== "pending";

  return (
    <form className="moment-booking-form" onSubmit={submit}>
      <section className="booking-block">
        <p className="booking-eyebrow">01 · YOUR MOMENT</p>
        <div className="booking-choice-grid booking-occasion-grid">
          {OCCASIONS.map((item) => (
            <button key={item} type="button" className={occasion === item ? "is-selected" : ""} onClick={() => setOccasion(item)}>
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="booking-block">
        <p className="booking-eyebrow">02 · HOW MUCH DO YOU WANT TO KEEP?</p>
        <div className="booking-package-grid">
          {PACKAGES.map((item) => (
            <button key={item.tier} type="button" className={tier === item.tier ? "is-selected" : ""} onClick={() => setTier(item.tier)}>
              <span>{item.name}</span>
              <strong>{item.price}</strong>
              <small>{item.detail}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="booking-block">
        <p className="booking-eyebrow">03 · CHOOSE THE DAY</p>
        <div className="booking-fields booking-fields-three">
          <label>
            <span>DISPLAY DATE</span>
            <input name="eventDate" type="date" min={minDate} required />
          </label>
          <label>
            <span>PREFERRED 4-HOUR WINDOW</span>
            <select value={preferredWindow} onChange={(event) => setPreferredWindow(event.target.value as WindowCode)}>
              {WINDOWS.map((window) => <option key={window.value} value={window.value}>{window.label}</option>)}
            </select>
          </label>
          <label>
            <span>BACKUP WINDOW</span>
            <select value={backupWindow} onChange={(event) => setBackupWindow(event.target.value as WindowCode | "")}>
              <option value="">No backup window</option>
              {WINDOWS.filter((window) => window.value !== preferredWindow).map((window) => <option key={window.value} value={window.value}>{window.label}</option>)}
            </select>
          </label>
        </div>
        <label className="booking-check booking-flexibility">
          <input type="checkbox" checked={anyTimeSameDay} onChange={(event) => setAnyTimeSameDay(event.target.checked)} />
          <span><strong>Any time that day is fine.</strong> Give us maximum freedom to secure your display if both selected windows fill.</span>
        </label>
        <div className="booking-promise">
          <strong>Choose the day. Choose the part of day. We handle the exact Times Square scheduling.</strong>
          <p>Your placement is fulfilled inside a confirmed four-hour window on your selected date. We route across eligible Times Square inventory unless a specific screen is explicitly sold to you. Exact playback minute is set by the media schedule.</p>
        </div>
      </section>

      <section className="booking-block">
        <p className="booking-eyebrow">04 · MAKE IT YOURS</p>
        <div className="booking-fields booking-fields-two">
          <label><span>YOUR NAME</span><input name="customerName" required minLength={2} maxLength={120} autoComplete="name" /></label>
          <label><span>EMAIL</span><input name="email" required type="email" autoComplete="email" /></label>
        </div>
        <label className="booking-wide-field">
          <span>MESSAGE ON THE MOMENT</span>
          <input name="creativeMessage" maxLength={240} placeholder="Will you marry me? · Happy 40th, Maya · I love you…" />
        </label>
        <label className="booking-upload">
          <span>PHOTO OR 15-SECOND VIDEO · VERTICAL 9:16</span>
          <input name="creative" type="file" required accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" />
          <small>JPG, PNG, WEBP, MP4, MOV or WEBM · up to 250 MB. Video must be 15 seconds.</small>
        </label>
      </section>

      <section className="booking-block booking-final-block">
        <label className="booking-check">
          <input type="checkbox" checked={legalAccepted} onChange={(event) => setLegalAccepted(event.target.checked)} required />
          <span>I confirm I have the rights to this content, accept the <Link href="/terms">Terms</Link>, acknowledge the <Link href="/privacy">Privacy Notice</Link>, and consent to licensed capture of the public display for my proof package.</span>
        </label>
        <p className="booking-no-charge">
          We validate your file before Stripe. <strong>After payment, we secure the best eligible same-day Times Square placement using the flexibility you selected.</strong> If an exceptional provider or inventory issue makes fulfillment impossible, the payment is automatically refunded in full.
        </p>
        {message && <p className={`booking-message ${phase === "pending" ? "is-pending" : ""}`}>{message}</p>}
        {error && <p className="booking-error" role="alert">{error}</p>}
        <button className="booking-submit" type="submit" disabled={working}>
          {working ? "PREPARING YOUR MOMENT…" : "PREPARE MY MOMENT · NO CHARGE YET"}
        </button>
      </section>
    </form>
  );
}
