import { getSupabaseAdmin } from "@/lib/supabase";
import { updateRingStatus } from "@/lib/rings";
import { submitBillboardJob } from "@/lib/providers/billboard";
import { requestProofCapture } from "@/lib/providers/proof";
import { publishProofSocial } from "@/lib/providers/social";
import { sendFounderEmail } from "@/lib/providers/email";

type FulfillmentJobRow = {
  startup_name: string;
  email: string;
  allow_social: boolean;
  provider_ref: string | null;
};

export async function claimStripeEvent(eventId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return true;
  const { error } = await supabase.from("fulfillment_events").insert({ event_id: eventId });
  if (!error) return true;
  if (error.code === "23505") return false;
  throw error;
}

export async function beginPaidFulfillment(input: {
  eventId: string;
  ringId: string | null;
  startupName: string;
  email: string;
  stripeSessionId: string;
  allowSocial: boolean;
}) {
  const result = await submitBillboardJob(input);
  const status = result.status === "submitted" ? "scheduled" : "manual_review";
  const supabase = getSupabaseAdmin();

  if (supabase) {
    await supabase.from("fulfillment_jobs").upsert({
      stripe_session_id: input.stripeSessionId,
      ring_id: input.ringId,
      startup_name: input.startupName,
      email: input.email,
      allow_social: input.allowSocial,
      provider_ref: result.providerRef ?? null,
      scheduled_at: result.scheduledAt ?? null,
      status,
      updated_at: new Date().toISOString(),
    }, { onConflict: "stripe_session_id" });
  }

  await updateRingStatus(input.ringId, status, "paid");
  await sendFounderEmail({
    to: input.email,
    subject: `Your Anti-Balcony proof drop is ${status === "scheduled" ? "in motion" : "reserved"}`,
    html: `<p><strong>${escapeHtml(input.startupName)}</strong> rang the Internet Bell.</p><p>Your paid placement is now <strong>${status.replace("_", " ")}</strong>. We will only mark it live after provider confirmation.</p>`,
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
}) {
  const supabase = getSupabaseAdmin();
  let job: FulfillmentJobRow | null = null;

  if (supabase) {
    const { data } = await supabase
      .from("fulfillment_jobs")
      .select("startup_name,email,allow_social,provider_ref")
      .eq("ring_id", input.ringId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    job = data as FulfillmentJobRow | null;
    await supabase.from("fulfillment_jobs").update({
      status: input.status,
      provider_ref: input.providerRef ?? job?.provider_ref ?? null,
      proof_url: input.proofUrl ?? null,
      updated_at: new Date().toISOString(),
    }).eq("ring_id", input.ringId);
  }

  await updateRingStatus(input.ringId, input.status, "paid");
  const startupName = input.startupName || job?.startup_name || "Your startup";
  const email = input.email || job?.email;
  const providerRef = input.providerRef || job?.provider_ref;

  if (input.status === "live" && !input.proofUrl) {
    await requestProofCapture({ ringId: input.ringId, providerRef, startupName });
    if (email) await sendFounderEmail({
      to: email,
      subject: `${startupName} is confirmed live`,
      html: `<p><strong>${escapeHtml(startupName)}</strong> has been confirmed live by the placement provider.</p><p>Proof capture is now being prepared.</p>`,
    });
  }

  if (input.status === "proof_ready" && input.proofUrl) {
    if (job?.allow_social) await publishProofSocial({ startupName, proofUrl: input.proofUrl, ringId: input.ringId });
    if (email) await sendFounderEmail({
      to: email,
      subject: `Your Times Square proof is ready`,
      html: `<p><strong>${escapeHtml(startupName)}</strong> left proof.</p><p><a href="${escapeAttribute(input.proofUrl)}">Open your proof package</a></p>`,
    });
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char] || char);
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
