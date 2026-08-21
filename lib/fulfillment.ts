import { Timestamp } from "firebase-admin/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { updateRingStatus } from "@/lib/rings";
import { PACKAGE_OPERATIONS, submitBillboardJob, type ProofTier } from "@/lib/providers/billboard";
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
  const operations = PACKAGE_OPERATIONS[input.tier];
  const status = operations.physicalCrew
    ? "ops_review"
    : result.status === "submitted"
      ? "scheduled"
      : "manual_review";
  const db = getFirebaseDb();

  if (db) {
    await db.collection("fulfillmentJobs").doc(input.stripeSessionId).set({
      stripeSessionId: input.stripeSessionId,
      ringId: input.ringId,
      startupName: input.startupName,
      email: input.email,
      allowSocial: input.allowSocial,
      providerRef: result.providerRef ?? null,
      scheduledAt: operations.physicalCrew ? null : result.scheduledAt ?? null,
      tier: input.tier,
      operations,
      operationsClearance: operations.physicalCrew ? "pending" : "not_required",
      status,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }, { merge: true });
  }

  await updateRingStatus(input.ringId, status, input.tier);
  await sendFounderEmail({
    to: input.email,
    subject: `Your Anti-Balcony ${tierName(input.tier)} is reserved`,
    html: operations.physicalCrew
      ? `<p><strong>${escapeHtml(input.startupName)}</strong> rang the Internet Bell.</p><p>Your ${escapeHtml(tierName(input.tier))} is reserved and now entering operations review for crew, media inventory, location rules, permits/insurance where required, and talent releases. We will not call the event scheduled until those checks clear.</p>`
      : `<p><strong>${escapeHtml(input.startupName)}</strong> rang the Internet Bell.</p><p>Your ${escapeHtml(tierName(input.tier))} is now <strong>${status.replace("_", " ")}</strong>. We will only mark it live after provider confirmation.</p>`,
  });

  return { status, providerRef: result.providerRef };
}

export async function handleFulfillmentCallback(input: {
  ringId: string;
  startupName?: string;
  email?: string;
  providerRef?: string | null;
  status: "ops_review" | "scheduled" | "live" | "proof_ready" | "failed";
  proofUrl?: string | null;
  videoUrl?: string | null;
  liveStreamUrl?: string | null;
  behindScenesUrl?: string | null;
  pressKitUrl?: string | null;
  prDistributionUrl?: string | null;
  permitRef?: string | null;
  insuranceRef?: string | null;
  talentReleaseRef?: string | null;
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
      const tier = job.tier || "snapshot";
      const physicalCrew = PACKAGE_OPERATIONS[tier].physicalCrew;
      await db.collection("fulfillmentJobs").doc(jobId).set({
        status: input.status,
        providerRef: input.providerRef ?? job.providerRef ?? null,
        proofUrl: input.proofUrl ?? null,
        videoUrl: input.videoUrl ?? null,
        liveStreamUrl: input.liveStreamUrl ?? null,
        behindScenesUrl: input.behindScenesUrl ?? null,
        pressKitUrl: input.pressKitUrl ?? null,
        prDistributionUrl: input.prDistributionUrl ?? null,
        permitRef: input.permitRef ?? null,
        insuranceRef: input.insuranceRef ?? null,
        talentReleaseRef: input.talentReleaseRef ?? null,
        operationsClearance: physicalCrew && input.status === "scheduled" ? "cleared" : physicalCrew ? "pending" : "not_required",
        updatedAt: Timestamp.now(),
      }, { merge: true });
    }
  }

  const tier = job?.tier || "snapshot";
  await updateRingStatus(input.ringId, input.status, tier);

  const startupName = input.startupName || job?.startupName || "Your startup";
  const email = input.email || job?.email;
  const providerRef = input.providerRef || job?.providerRef;

  if (input.status === "scheduled" && email && PACKAGE_OPERATIONS[tier].physicalCrew) {
    await sendFounderEmail({
      to: email,
      subject: `${startupName} Takeover is cleared and scheduled`,
      html: `<p>Your on-site ${escapeHtml(tierName(tier))} has cleared operations review and is now scheduled.</p>`,
    });
  }

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
      await publishProofSocial({
        startupName,
        proofUrl: input.proofUrl,
        videoUrl: input.videoUrl,
        liveStreamUrl: input.liveStreamUrl,
        ringId: input.ringId,
      });
    }

    if (email) {
      const links = [
        `<p><a href="${escapeAttribute(input.proofUrl)}">Open screenshot / proof</a></p>`,
        input.videoUrl ? `<p><a href="${escapeAttribute(input.videoUrl)}">Open launch video</a></p>` : "",
        input.liveStreamUrl ? `<p><a href="${escapeAttribute(input.liveStreamUrl)}">Open live-stream link</a></p>` : "",
        input.behindScenesUrl ? `<p><a href="${escapeAttribute(input.behindScenesUrl)}">Open behind-the-scenes assets</a></p>` : "",
        input.pressKitUrl ? `<p><a href="${escapeAttribute(input.pressKitUrl)}">Open press kit</a></p>` : "",
        input.prDistributionUrl ? `<p><a href="${escapeAttribute(input.prDistributionUrl)}">Open PR distribution record</a></p>` : "",
      ].join("");

      await sendFounderEmail({
        to: email,
        subject: `Your Times Square launch assets are ready`,
        html: `<p><strong>${escapeHtml(startupName)}</strong> left proof.</p>${links}`,
      });
    }
  }
}

function tierName(tier: ProofTier) {
  if (tier === "snapshot") return "Signal Drop";
  if (tier === "video") return "Motion Drop";
  if (tier === "takeover") return "Times Square Takeover";
  return "VIP Takeover";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char] || char);
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
