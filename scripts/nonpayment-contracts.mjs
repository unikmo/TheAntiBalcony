import assert from "node:assert/strict";

const { PACKAGE_OPERATIONS, submitBillboardJob } = await import("../lib/providers/billboard.ts");
const { assertFulfillmentTransition } = await import("../lib/fulfillment-state.ts");
const { escapeHtmlAttribute, safeJsonLd } = await import("../lib/security.ts");

const snapshot = PACKAGE_OPERATIONS.snapshot;
const video = PACKAGE_OPERATIONS.video;
const takeover = PACKAGE_OPERATIONS.takeover;
const vip = PACKAGE_OPERATIONS.vip;

assert.equal(snapshot.physicalCrew, false, "snapshot must remain digital-only");
assert.equal(snapshot.actorCount, 0);
assert.equal(snapshot.permitReviewRequired, false);
assert.equal(snapshot.releaseFormsRequired, false);
assert(snapshot.deliverables.includes("static screenshot"));

assert.equal(video.physicalCrew, false, "video must remain digital-only");
assert.equal(video.actorCount, 0);
assert(video.deliverables.includes("15-second video clip"));

assert.equal(takeover.physicalCrew, true, "takeover must require physical operations");
assert.equal(takeover.actorCount, 2);
assert.equal(takeover.videographer, "mobile");
assert.equal(takeover.liveStreamMinutes, 15);
assert.equal(takeover.permitReviewRequired, true);
assert.equal(takeover.releaseFormsRequired, true);
assert.equal(takeover.pressKit, true);
assert.equal(takeover.prDistributionWorkflow, false);

assert.equal(vip.physicalCrew, true, "VIP must require physical operations");
assert.equal(vip.actorCount, 5);
assert.equal(vip.videographer, "professional");
assert.equal(vip.liveStreamMinutes, 60);
assert.equal(vip.permitReviewRequired, true);
assert.equal(vip.releaseFormsRequired, true);
assert.equal(vip.pressKit, true);
assert.equal(vip.prDistributionWorkflow, true);

for (const key of [
  "ZAPIER_OPERATIONS_WEBHOOK_URL",
  "ZAPIER_BILLBOARD_WEBHOOK_URL",
  "BILLBOARD_FULFILLMENT_WEBHOOK_URL",
]) {
  delete process.env[key];
}

for (const tier of ["snapshot", "video", "takeover", "vip"]) {
  const result = await submitBillboardJob({
    eventId: `test-${tier}`,
    ringId: "ring-test",
    startupName: "Nonpayment Test",
    email: "test@example.com",
    stripeSessionId: `session-${tier}`,
    tier,
  });
  assert.equal(result.status, "manual_review", `${tier} must fail safely to manual review without an operations hook`);
}

const allowedTransitions = [
  { current: "manual_review", next: "scheduled", physicalCrew: false, operationsClearance: "not_required" },
  { current: "scheduled", next: "live", physicalCrew: false, operationsClearance: "not_required" },
  { current: "live", next: "proof_ready", physicalCrew: false, operationsClearance: "not_required" },
  { current: "ops_review", next: "scheduled", physicalCrew: true, operationsClearance: "pending" },
  { current: "scheduled", next: "live", physicalCrew: true, operationsClearance: "cleared" },
  { current: "live", next: "proof_ready", physicalCrew: true, operationsClearance: "cleared" },
  { current: "scheduled", next: "scheduled", physicalCrew: true, operationsClearance: "cleared" },
  { current: "ops_review", next: "failed", physicalCrew: true, operationsClearance: "pending" },
];

for (const transition of allowedTransitions) {
  assert.doesNotThrow(() => assertFulfillmentTransition(transition), `${transition.current} -> ${transition.next} should be allowed`);
}

const forbiddenTransitions = [
  { current: "manual_review", next: "live", physicalCrew: false, operationsClearance: "not_required" },
  { current: "manual_review", next: "proof_ready", physicalCrew: false, operationsClearance: "not_required" },
  { current: "ops_review", next: "live", physicalCrew: true, operationsClearance: "pending" },
  { current: "ops_review", next: "proof_ready", physicalCrew: true, operationsClearance: "pending" },
  { current: "scheduled", next: "live", physicalCrew: true, operationsClearance: "pending" },
  { current: "proof_ready", next: "live", physicalCrew: true, operationsClearance: "cleared" },
  { current: "failed", next: "scheduled", physicalCrew: true, operationsClearance: "pending" },
];

for (const transition of forbiddenTransitions) {
  assert.throws(() => assertFulfillmentTransition(transition), undefined, `${transition.current} -> ${transition.next} must be rejected`);
}

const hostileJsonLd = safeJsonLd({ founder: "</script><script>window.__xss=1</script>", ampersand: "A&B" });
assert.equal(hostileJsonLd.includes("</script>"), false, "JSON-LD must not contain a literal script-closing sequence");
assert.match(hostileJsonLd, /\\u003c\/script\\u003e/);
assert.match(hostileJsonLd, /A\\u0026B/);

const hostileAttribute = escapeHtmlAttribute('Founder" onerror="alert(1)<script>');
assert.equal(hostileAttribute.includes('" onerror="'), false, "embed attributes must not preserve quote-breaking input");
assert.match(hostileAttribute, /&quot;/);
assert.match(hostileAttribute, /&lt;script&gt;/);

console.log("nonpayment-contracts: PASS");
