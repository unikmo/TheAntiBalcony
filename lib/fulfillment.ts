import { Timestamp } from "firebase-admin/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { updateRingStatus } from "@/lib/rings";
import { submitBillboardJob, type ProofTier } from "@/lib/providers/billboard";
import { requestProofCapture } from "@/lib/providers/proof";
import { publishProofSocial } from "@/lib/providers/social";
import { sendFounderEmail } from "@/lib/providers/email";

type FulfillmentJobDoc = {
  ringId: string | null;
  startupName: string;
  email: string;
  allowSocial: boolean;
  providerRef: string | null;
  tier: ProofTier;
  status: string;
  createdAt?: Timestamp;
};

export async function claimStripeEvent(eventId: string) {
  const db = getFirebaseDb();
  if (!db) return true;

  const ref = db.collection("fulfillmentEvents").doc(eventId);
  return db.runTransaction(async (transaction) => {
    const existing = await transaction.get(ref);
    if (existing.exists) return false;
    transaction.create(ref, { eventId, createdAt: Timestamp.now() });
    return true;
  });
}

export async function beginPaidFulfillment(input: {
  eventId: string;
  ringId: string | null;
  startupName: string;
  email: string;
  stripeSessionId: string;
  allowSocial: boolean;
  tier: ProofTier;
}) {
  const result = await submitBillboardJob(input);
  const status = result.status === "submitted" ? "scheduled" : "manual_review";
  const db = getFirebaseDb();

  if (db) {
    await db.collection("fulfillmentJobs").doc(input.stripeSessionId).set({
      stripeSessionId: input.stripeSessionId,
      ringId: input.ringId,
      startupName: input.startupName,
      email: input.email,
      allowSocial: input.allowSocial,
      providerRef: result.providerRef ?? null,
      scheduledAt: result.scheduledAt ?? null,
      tier: input.tier,
      status,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }, { merge: true });
  }

  await updateRingStatus(input.ringId, status, input.tier);
  await sendFounderEmail({
    to: input.email,
    subject: `Your Anti-Balcony ${tierName(input.tier)} is ${status === "scheduled" ? "in motion" : "reserved"}`,
    html: `<p><strong>${escapeHtml(input.startupName)}</strong> rang the Internet Bell.</p><p>Your ${escapeHtml(tierName(input.tier))} is now <strong>${status.replace("_", " ")}</strong>. We will only mark it live after provider confirmation.</p>`,
  });

  return { status, providerRef: result.providerRef };
}

export async function handleFulfillmentCallback(input: {
  ringId: string;
  startupName?: string;
  email?: string;
  providerRef?: string | null;
  status: "scheduled" | "live" | "proof_ready" | "failed";
  proofUrl?: string | null;
  videoUrl?: string | null;
  liveStreamUrl?: string | null;
}) {
  const db = getFirebaseDb();
  let job: FulfillmentJobDoc | null = null;
  let jobId: string | null = null;

  if (db) {
    const jobs = await db.collection("fulfillmentJobs").where("ringId", "==", input.ringId).limit(10).get();
    const chosen = jobs.docs
      .map((doc) => ({ id: doc.id, data: doc.data() as FulfillmentJobDoc }))
      .sort((a, b) => (b.data.createdAt?.toMillis() ?? 0) - (a.data.createdAt?.toMillis() ?? 0))[0];

    if (chosen) {
      job = chosen.data;
      jobId = chosen.id;
      await db.collection("fulfillmentJobs").doc(jobId).set({
        status: input.status,
        providerRef: input.providerRef ?? job.providerRef ?? null,
        proofUrl: input.proofUrl ?? null,
        videoUrl: input.videoUrl ?? null,
        liveStreamUrl: input.liveStreamUrl ?? null,
        updatedAt: Timestamp.now(),
      }, { merge: true });
    }
  }

  const tier = job?.tier || "snapshot";
  await updateRingStatus(input.ringId, input.status, tier);

  const startupName = input.startupName || job?.startupName || "Your startup";
  const email = input.email || job?.email;
  const providerRef = input.providerRef || job?.providerRef;

  if (input.status === "live" && !input.proofUrl) {
    await requestProofCapture({ ringId: input.ringId, providerRef, startupName, tier });
    if (email) await sendFounderEmail({
      to: email,
      subject: `${startupName} is confirmed live`,
      html: `<p><strong>${escapeHtml(startupName)}</strong> has been confirmed live by the placement provider.</p><p>Your ${escapeHtml(tierName(tier))} assets are now being prepared.</p>`,
    });
  }

  if (input.status === "proof_ready" && input.proofUrl) {
    if (job?.allowSocial) {
      await publishProofSocial({ startupName, proofUrl: input.proofUrl, ringId: input.ringId });
    }

    if (email) {
      const links = [
        `<p><a href="${escapeAttribute(input.proofUrl)}">Open screenshot / proof</a></p>`,
        input.videoUrl ? `<p><a href="${escapeAttribute(input.videoUrl)}">Open 15-second video</a></p>` : "",
        input.liveStreamUrl ? `<p><a href="${escapeAttribute(input.liveStreamUrl)}">Open live-stream link</a></p>` : "",
      ].join("");

      await sendFounderEmail({
        to: email,
        subject: `Your Times Square proof is ready`,
        html: `<p><strong>${escapeHtml(startupName)}</strong> left proof.</p>${links}`,
      });
    }
  }
}

function tierName(tier: ProofTier) {
  return tier === "snapshot" ? "Signal Drop" : tier === "video" ? "Motion Drop" : "Live Takeover";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char] || char);
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
