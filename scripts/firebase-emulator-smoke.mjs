import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error("FIRESTORE_EMULATOR_HOST is required. Run this through Firebase emulators:exec.");
}

const port = 3300;
const base = `http://127.0.0.1:${port}`;
const secret = "firebase-emulator-callback-secret";
const projectId = "theantibalcony";
const nextBin = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));

const db = getFirestore(initializeApp({ projectId }, "integration-test-client"));

const server = spawn(process.execPath, [nextBin, "start", "-p", String(port)], {
  env: {
    ...process.env,
    PORT: String(port),
    NEXT_PUBLIC_SITE_URL: base,
    FIREBASE_PROJECT_ID: projectId,
    FIREBASE_CLIENT_EMAIL: "",
    FIREBASE_PRIVATE_KEY: "",
    FULFILLMENT_CALLBACK_SECRET: secret,
    STRIPE_SECRET_KEY: "",
    STRIPE_PRICE_SNAPSHOT: "",
    STRIPE_PRICE_VIDEO: "",
    STRIPE_PRICE_TAKEOVER: "",
    STRIPE_PRICE_VIP: "",
    ZAPIER_BILLBOARD_WEBHOOK_URL: "",
    BILLBOARD_FULFILLMENT_WEBHOOK_URL: "",
    ZAPIER_PROOF_WEBHOOK_URL: "",
    PROOF_CAPTURE_WEBHOOK_URL: "",
    ZAPIER_SOCIAL_WEBHOOK_URL: "",
    SOCIAL_PUBLISH_WEBHOOK_URL: "",
    RESEND_API_KEY: "",
    RESEND_FROM: "",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let serverOutput = "";
server.stdout.on("data", (chunk) => { serverOutput += chunk.toString(); });
server.stderr.on("data", (chunk) => { serverOutput += chunk.toString(); });

async function waitForServer() {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Next server exited early.\n${serverOutput}`);
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`Next server did not become ready.\n${serverOutput}`);
}

async function post(path, body, expectedStatus, auth = false) {
  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Authorization: `Bearer ${secret}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  assert.equal(response.status, expectedStatus, `${path}: expected ${expectedStatus}, got ${response.status}: ${JSON.stringify(data)}`);
  return data;
}

async function getJob(id) {
  const snapshot = await db.collection("fulfillmentJobs").doc(id).get();
  assert.equal(snapshot.exists, true, `fulfillment job ${id} should exist`);
  return snapshot.data();
}

try {
  await waitForServer();

  const health = await (await fetch(`${base}/api/health`)).json();
  assert.equal(health.firebase, true, "health must recognize emulator-backed Firebase");
  assert.equal(health.database, true);
  assert.equal(health.stripe, false);

  const rich = await post("/api/rings", {
    startupName: "Emulator Launch",
    website: "https://example.com",
    socialUrl: "https://linkedin.com/company/example",
    tagline: "A persisted public startup launch.",
    category: "SaaS",
    whatItDoes: "Creates a permanent public launch artifact for startup teams.",
    intendedCustomer: "Startup founders and launch teams.",
    founder: "Emulator Founder",
    problem: "Launches disappear into temporary feeds and disconnected posts.",
    story: "Built to make a startup launch permanent, shareable and useful after launch day.",
    imageUrl: "https://example.com/product.jpg",
  }, 201);

  assert.equal(rich.persisted, true);
  assert.equal(rich.ring.indexable, true);
  const ringId = rich.ring.id;
  const ringSlug = rich.ring.slug;

  const stored = await db.collection("rings").doc(ringId).get();
  assert.equal(stored.exists, true);
  assert.equal(stored.data().startupName, "Emulator Launch");
  assert.equal(stored.data().indexable, true);

  const list = await (await fetch(`${base}/api/rings`)).json();
  assert(list.rings.some((ring) => ring.id === ringId), "persisted Ring must be returned by the public list API");

  const publicPage = await fetch(`${base}/launches/${ringSlug}`);
  assert.equal(publicPage.status, 200);
  const publicHtml = await publicPage.text();
  assert.match(publicHtml, /Emulator Launch/);
  assert.match(publicHtml, /Emulator Founder/);
  assert.match(publicHtml, /eligible|What it does|Founder story/i);

  const badge = await fetch(`${base}/api/rings/${ringSlug}/badge`);
  assert.equal(badge.status, 200);
  assert.match(badge.headers.get("content-type") || "", /image\/svg\+xml/);
  const badgeSvg = await badge.text();
  assert.match(badgeSvg, /EMULATOR LAUNCH/);
  assert.match(badgeSvg, /RUNG IN ON THE ANTI-BALCONY/);

  const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
  assert.match(sitemap, new RegExp(`/launches/${ringSlug}`));

  const thin = await post("/api/rings", {
    startupName: "Thin Emulator Ring",
    website: "https://example.org",
    tagline: "Intentionally incomplete.",
  }, 201);
  assert.equal(thin.persisted, true);
  assert.equal(thin.ring.indexable, false);

  const thinPage = await fetch(`${base}/launches/${thin.ring.slug}`);
  assert.equal(thinPage.status, 200);
  const thinHtml = await thinPage.text();
  assert.match(thinHtml, /noindex/i);

  const physicalJobId = "takeover-integration-job";
  await db.collection("fulfillmentJobs").doc(physicalJobId).set({
    stripeSessionId: physicalJobId,
    ringId,
    startupName: "Emulator Launch",
    email: "founder@example.com",
    allowSocial: false,
    providerRef: "provider-test",
    tier: "takeover",
    status: "ops_review",
    operationsClearance: "pending",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  const physicalTooEarly = await post("/api/fulfillment/callback", {
    ringId,
    status: "live",
  }, 400, true);
  assert.match(physicalTooEarly.error, /Invalid physical fulfillment transition|operations clearance/i);

  await post("/api/fulfillment/callback", { ringId, status: "scheduled" }, 200, true);
  let physicalJob = await getJob(physicalJobId);
  assert.equal(physicalJob.status, "scheduled");
  assert.equal(physicalJob.operationsClearance, "cleared");

  await post("/api/fulfillment/callback", { ringId, status: "live" }, 200, true);
  physicalJob = await getJob(physicalJobId);
  assert.equal(physicalJob.status, "live");
  assert.equal(physicalJob.operationsClearance, "cleared", "clearance must not regress after going live");

  const missingProof = await post("/api/fulfillment/callback", { ringId, status: "proof_ready" }, 400, true);
  assert.match(missingProof.error, /proofUrl/);

  await post("/api/fulfillment/callback", {
    ringId,
    status: "proof_ready",
    proofUrl: "https://example.com/proof.png",
    videoUrl: "https://example.com/launch.mp4",
  }, 200, true);
  physicalJob = await getJob(physicalJobId);
  assert.equal(physicalJob.status, "proof_ready");
  assert.equal(physicalJob.operationsClearance, "cleared");

  const cannotRegress = await post("/api/fulfillment/callback", { ringId, status: "scheduled" }, 400, true);
  assert.match(cannotRegress.error, /already complete|Invalid physical/i);

  const ringAfterFulfillment = await db.collection("rings").doc(ringId).get();
  assert.equal(ringAfterFulfillment.data().status, "proof_ready");
  assert.equal(ringAfterFulfillment.data().tier, "takeover");

  const digitalRing = await post("/api/rings", {
    startupName: "Digital Fulfillment Test",
    website: "https://example.net",
  }, 201);
  const digitalJobId = "digital-integration-job";
  await db.collection("fulfillmentJobs").doc(digitalJobId).set({
    stripeSessionId: digitalJobId,
    ringId: digitalRing.ring.id,
    startupName: "Digital Fulfillment Test",
    email: "digital@example.com",
    allowSocial: false,
    providerRef: "provider-digital",
    tier: "video",
    status: "manual_review",
    operationsClearance: "not_required",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  const digitalTooEarly = await post("/api/fulfillment/callback", {
    ringId: digitalRing.ring.id,
    status: "live",
  }, 400, true);
  assert.match(digitalTooEarly.error, /Invalid digital fulfillment transition/i);

  await post("/api/fulfillment/callback", { ringId: digitalRing.ring.id, status: "scheduled" }, 200, true);
  await post("/api/fulfillment/callback", { ringId: digitalRing.ring.id, status: "live" }, 200, true);
  await post("/api/fulfillment/callback", {
    ringId: digitalRing.ring.id,
    status: "proof_ready",
    proofUrl: "https://example.com/digital-proof.png",
    videoUrl: "https://example.com/digital-video.mp4",
  }, 200, true);

  const digitalJob = await getJob(digitalJobId);
  assert.equal(digitalJob.status, "proof_ready");
  assert.equal(digitalJob.operationsClearance, "not_required");

  console.log("firebase-emulator-smoke: PASS");
} finally {
  if (server.exitCode === null) server.kill("SIGTERM");
  await new Promise((resolve) => {
    if (server.exitCode !== null) return resolve();
    const timer = setTimeout(() => {
      if (server.exitCode === null) server.kill("SIGKILL");
      resolve();
    }, 3000);
    server.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}
