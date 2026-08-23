import { getSupabaseAdmin } from "@/lib/supabase";
import {
  assertFulfillmentTransition,
  type CallbackFulfillmentStatus,
  type FulfillmentStatus,
  type OperationsClearance,
} from "@/lib/fulfillment-state";
import { updateRingStatus } from "@/lib/rings";
import { PACKAGE_OPERATIONS, submitBillboardJob, type ProofTier } from "@/lib/providers/billboard";
import { requestProofCapture } from "@/lib/providers/proof";
import { publishProofSocial } from "@/lib/providers/social";
import { sendFounderEmail } from "@/lib/providers/email";

type FulfillmentJobRow = {
  stripe_session_id: string;
  ring_id: string | null;
  startup_name: string;
  email: string;
  allow_social: boolean;
  provider_ref: string | null;
  tier: ProofTier;
  status: FulfillmentStatus;
  operations_clearance: OperationsClearance;
  proof_url: string | null;
  video_url: string | null;
  live_stream_url: string | null;
  behind_scenes_url: string | null;
  press_kit_url: string | null;
  pr_distribution_url: string | null;
  permit_ref: string | null;
  insurance_ref: string | null;
  talent_release_ref: string | null;
  created_at: string;
};

export async function claimStripeEvent(eventId: string) {
  const db = getSupabaseAdmin();
  if (!db) throw new Error("Fulfillment database is not configured.");

  const { error } = await db
    .from("anti_balcony_fulfillment_events")
    .insert({ event_id: eventId });

  if (!error) return true;
  if (error.code === "23505") return false;
  throw new Error(`Could not claim Stripe event: ${error.message}`);
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
  const db = getSupabaseAdmin();
  if (!db) throw new Error("Fulfillment database is not configured.");

  const result = await submitBillboardJob(input);
  const operations = PACKAGE_OPERATIONS[input.tier];
  const status: FulfillmentStatus = operations.physicalCrew
    ? "ops_review"
    : result.status === "submitted"
      ? "scheduled"
      : "manual_review";

  const now = new Date().toISOString();
  const { error } = await db.from("anti_balcony_fulfillment_jobs").upsert({
    stripe_session_id: input.stripeSessionId,
    event_id: input.eventId,
    ring_id: input.ringId,
    startup_name: input.startupName,
    email: input.email,
    allow_social: input.allowSocial,
    provider_ref: result.providerRef ?? null,
    scheduled_at: operations.physicalCrew ? null : result.scheduledAt ?? null,
    tier: input.tier,
    operations,
    operations_clearance: operations.physicalCrew ? "pending" : "not_required",
    status,
    created_at: now,
    updated_at: now,
  }, { onConflict: "stripe_session_id" });

  if (error) throw new Error(`Could not save fulfillment job: ${error.message}`);

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
  status: CallbackFulfillmentStatus;
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
  const db = getSupabaseAdmin();
  if (!db) throw new Error("Fulfillment database is not configured.");

  const { data, error } = await db
    .from("anti_balcony_fulfillment_jobs")
    .select("*")
    .eq("ring_id", input.ringId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Could not load fulfillment job: ${error.message}`);
  if (!data) throw new Error("Fulfillment job not found for this Ring.");

  const job = data as FulfillmentJobRow;
  const tier = job.tier || "snapshot";
  const physicalCrew = PACKAGE_OPERATIONS[tier].physicalCrew;
  const currentClearance: OperationsClearance = job.operations_clearance || (physicalCrew ? "pending" : "not_required");

  assertFulfillmentTransition({
    current: job.status,
    next: input.status,
    physicalCrew,
    operationsClearance: currentClearance,
  });

  const nextClearance: OperationsClearance = physicalCrew
    ? input.status === "scheduled"
      ? "cleared"
      : currentClearance
    : "not_required";

  const patch = {
    status: input.status,
    provider_ref: input.providerRef ?? job.provider_ref ?? null,
    proof_url: input.proofUrl ?? job.proof_url ?? null,
    video_url: input.videoUrl ?? job.video_url ?? null,
    live_stream_url: input.liveStreamUrl ?? job.live_stream_url ?? null,
    behind_scenes_url: input.behindScenesUrl ?? job.behind_scenes_url ?? null,
    press_kit_url: input.pressKitUrl ?? job.press_kit_url ?? null,
    pr_distribution_url: input.prDistributionUrl ?? job.pr_distribution_url ?? null,
    permit_ref: input.permitRef ?? job.permit_ref ?? null,
    insurance_ref: input.insuranceRef ?? job.insurance_ref ?? null,
    talent_release_ref: input.talentReleaseRef ?? job.talent_release_ref ?? null,
    operations_clearance: nextClearance,
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await db
    .from("anti_balcony_fulfillment_jobs")
    .update(patch)
    .eq("stripe_session_id", job.stripe_session_id);

  if (updateError) throw new Error(`Could not update fulfillment job: ${updateError.message}`);

  await updateRingStatus(input.ringId, input.status, tier);

  const startupName = input.startupName || job.startup_name || "Your startup";
  const email = input.email || job.email;
  const providerRef = input.providerRef || job.provider_ref;

  if (input.status === "scheduled" && email && physicalCrew) {
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
    if (job.allow_social) {
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
        subject: "Your Times Square launch assets are ready",
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
