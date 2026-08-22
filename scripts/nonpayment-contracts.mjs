import assert from "node:assert/strict";

const { PACKAGE_OPERATIONS, submitBillboardJob } = await import("../lib/providers/billboard.ts");

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

for (const key of ["ZAPIER_BILLBOARD_WEBHOOK_URL", "BILLBOARD_FULFILLMENT_WEBHOOK_URL"]) {
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
  assert.equal(result.status, "manual_review", `${tier} must fail safely to manual review without a fulfillment bridge`);
}

console.log("nonpayment-contracts: PASS");
