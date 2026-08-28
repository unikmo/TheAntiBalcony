"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { validateCreativeSpec } from "@/lib/creative-spec";

type Tier = "snapshot" | "video" | "takeover" | "vip";

type OrderResponse = {
  order?: { id: string; orderRef: string; status: string };
  accessToken?: string;
  upload?: {
    bucket: string;
    path: string;
    token: string;
    endpoint: string;
    publishableKey: string;
    contentType: string;
  };
  error?: string;
};

const WINDOWS = [
  { value: "08:00", label: "Morning · 8–9 AM" },
  { value: "12:00", label: "Afternoon · 12–1 PM" },
  { value: "17:00", label: "Evening · 5–6 PM" },
  { value: "19:00", label: "Prime evening · 7–8 PM" },
  { value: "21:00", label: "Night · 9–10 PM" },
];

export function PackageRequestForm(input: { ringId: string; startupName: string; tier: Tier }) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ orderRef: string; warnings: string[] } | null>(null);
  const [timezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Choose the 9:16 image or 15-second video you want adapted for the NASDAQ Tower.");
      return;
    }
    setLoading(true);
    setProgress(0);
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      const creative = await inspectCreative(file);
      const requested = oneHourWindow(String(form.get("preferredDate")), String(form.get("preferredTime")));
      const alternativeDate = String(form.get("alternativeDate") || "");
      const alternativeTime = String(form.get("alternativeTime") || "");
      const alternative = alternativeDate && alternativeTime ? oneHourWindow(alternativeDate, alternativeTime) : null;
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ringId: input.ringId,
          tier: input.tier,
          email: String(form.get("email")),
          timezone,
          requestedWindowStart: requested.start,
          requestedWindowEnd: requested.end,
          alternativeWindowStart: alternative?.start || null,
          alternativeWindowEnd: alternative?.end || null,
          creativeFilename: file.name,
          creativeContentType: file.type,
          creativeSize: file.size,
          creativeWidth: creative.width,
          creativeHeight: creative.height,
          creativeDurationSeconds: creative.durationSeconds,
          allowSocial: form.get("allowSocial") === "on",
          rightsAccepted: form.get("rightsAccepted") === "on",
          qrPolicyAccepted: form.get("qrPolicyAccepted") === "on",
          captureConsent: form.get("captureConsent") === "on",
          termsAccepted: form.get("termsAccepted") === "on",
          privacyAcknowledged: form.get("privacyAcknowledged") === "on",
        }),
      });
      const data = await response.json() as OrderResponse;
      if (!response.ok || !data.order || !data.accessToken || !data.upload) {
        throw new Error(data.error || "Could not create the request.");
      }

      await uploadCreative(file, data.upload, setProgress);
      const complete = await fetch(`/api/orders/${data.order.id}/creative/complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${data.accessToken}` },
      });
      const completed = await complete.json() as { order?: { orderRef: string }; warnings?: string[]; error?: string };
      if (!complete.ok || !completed.order) throw new Error(completed.error || "Creative uploaded, but the request could not be finalized.");
      sessionStorage.setItem(`anti-balcony-order-${data.order.id}`, data.accessToken);
      setResult({ orderRef: completed.order.orderRef, warnings: completed.warnings || [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit the request.");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="package-request-confirmation" role="status">
        <small>REQUEST RECEIVED</small>
        <h3>{input.startupName} is now in availability review.</h3>
        <p>Reference <strong>{result.orderRef}</strong>. No payment has been taken. We will first confirm NASDAQ Tower availability and creative approval.</p>
        {result.warnings.length > 0 && <p className="launch-error">The request is saved, but an operations notification needs manual follow-up.</p>}
      </div>
    );
  }

  return (
    <form className="package-request-form" onSubmit={submit}>
      <div className="package-request-head">
        <small>NASDAQ TOWER REQUEST</small>
        <h3>Send the moment for review.</h3>
        <p>Submit one 9:16 master. We adapt it to the tower template after availability and creative approval.</p>
      </div>

      <label>DELIVERY EMAIL<input name="email" type="email" required placeholder="founder@startup.com" /></label>
      <label>YOUR TIMEZONE<input value={timezone} readOnly aria-label="Your timezone" /></label>
      <label>PREFERRED DATE<input name="preferredDate" type="date" required /></label>
      <label>PREFERRED ONE-HOUR WINDOW<select name="preferredTime" defaultValue="19:00">{WINDOWS.map((window) => <option key={window.value} value={window.value}>{window.label}</option>)}</select></label>
      <label>ALTERNATIVE DATE<input name="alternativeDate" type="date" /></label>
      <label>ALTERNATIVE WINDOW<select name="alternativeTime" defaultValue=""><option value="">No alternative</option>{WINDOWS.map((window) => <option key={window.value} value={window.value}>{window.label}</option>)}</select></label>

      <label className="full creative-upload-field">
        9:16 CREATIVE MASTER
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
          required
          onChange={(event) => setFile(event.target.files?.[0] || null)}
        />
        <span>JPG, PNG, WebP, MP4, MOV or WebM · up to 250 MB</span>
      </label>

      <div className="package-legal full">
        <label className="launch-consent"><input name="rightsAccepted" type="checkbox" required /><span>I own or control the rights to every logo, trademark, image, person and sound in the creative.</span></label>
        <label className="launch-consent"><input name="qrPolicyAccepted" type="checkbox" required /><span>I understand QR codes and direct product URLs may be rejected by the billboard operator.</span></label>
        <label className="launch-consent"><input name="captureConsent" type="checkbox" required /><span>I authorize licensed recording, editing and delivery of the confirmed appearance.</span></label>
        <label className="launch-consent"><input name="termsAccepted" type="checkbox" required /><span>I accept the <Link href="/terms">Terms</Link>.</span></label>
        <label className="launch-consent"><input name="privacyAcknowledged" type="checkbox" required /><span>I acknowledge the <Link href="/privacy">Privacy Notice</Link>.</span></label>
        <label className="launch-consent"><input name="allowSocial" type="checkbox" /><span>The Anti-Balcony may publish the confirmed proof after delivery.</span></label>
      </div>

      {loading && <div className="upload-progress full" aria-live="polite"><span style={{ width: `${progress}%` }} /><b>{progress < 100 ? `UPLOADING ${progress}%` : "FINALIZING REQUEST"}</b></div>}
      {error && <p className="launch-error full" role="alert">{error}</p>}
      <button className="launch-submit full" disabled={loading}>{loading ? "SENDING THE MOMENT…" : "SEND FOR AVAILABILITY REVIEW"}</button>
      <p className="launch-help full">No payment is taken now. Blindspot booking begins only after availability, creative approval and a later payment confirmation.</p>
    </form>
  );
}

async function inspectCreative(file: File) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const metadata = file.type.startsWith("image/")
      ? await inspectImage(objectUrl)
      : await inspectVideo(objectUrl);
    validateCreativeSpec({ contentType: file.type, ...metadata });
    return metadata;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function inspectImage(url: string) {
  return new Promise<{ width: number; height: number; durationSeconds: null }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight, durationSeconds: null });
    image.onerror = () => reject(new Error("The image could not be read. Export it as JPG, PNG or WebP and try again."));
    image.src = url;
  });
}

function inspectVideo(url: string) {
  return new Promise<{ width: number; height: number; durationSeconds: number }>((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => resolve({
      width: video.videoWidth,
      height: video.videoHeight,
      durationSeconds: video.duration,
    });
    video.onerror = () => reject(new Error("The video metadata could not be read. Export a 15-second MP4 or WebM and try again."));
    video.src = url;
  });
}

function oneHourWindow(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) throw new Error("Choose a valid date and one-hour window.");
  const start = new Date(`${date}T${time}:00`);
  if (!Number.isFinite(start.getTime())) throw new Error("Choose a valid placement window.");
  return { start: start.toISOString(), end: new Date(start.getTime() + 60 * 60 * 1000).toISOString() };
}

async function uploadCreative(
  file: File,
  upload: NonNullable<OrderResponse["upload"]>,
  setProgress: (value: number) => void,
) {
  const tus = await import("tus-js-client");
  return new Promise<void>((resolve, reject) => {
    const task = new tus.Upload(file, {
      endpoint: upload.endpoint,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        apikey: upload.publishableKey,
        "x-signature": upload.token,
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: 6 * 1024 * 1024,
      metadata: {
        bucketName: upload.bucket,
        objectName: upload.path,
        contentType: upload.contentType,
        cacheControl: "3600",
      },
      onError: (error) => reject(new Error(`Creative upload failed: ${error.message}`)),
      onProgress: (uploaded, total) => setProgress(Math.min(99, Math.round((uploaded / total) * 100))),
      onSuccess: () => { setProgress(100); resolve(); },
    });
    task.start();
  });
}
