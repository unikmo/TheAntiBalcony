import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const port = 3100;
const base = `http://127.0.0.1:${port}`;
const secret = "nonpayment-smoke-secret";
const nextBin = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));

const env = {
  ...process.env,
  PORT: String(port),
  NEXT_PUBLIC_SITE_URL: base,
  FULFILLMENT_CALLBACK_SECRET: secret,
  FIREBASE_PROJECT_ID: "",
  FIREBASE_CLIENT_EMAIL: "",
  FIREBASE_PRIVATE_KEY: "",
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
};

const server = spawn(process.execPath, [nextBin, "start", "-p", String(port)], {
  env,
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
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Next server did not become ready.\n${serverOutput}`);
}

async function get(path, expectedStatus = 200) {
  const response = await fetch(`${base}${path}`, { redirect: "manual" });
  assert.equal(response.status, expectedStatus, `${path} expected ${expectedStatus}, got ${response.status}`);
  return response;
}

async function postJson(path, body, expectedStatus, auth = false) {
  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Authorization: `Bearer ${secret}` } : {}),
    },
    body: JSON.stringify(body),
  });
  assert.equal(response.status, expectedStatus, `${path} expected ${expectedStatus}, got ${response.status}`);
  return response;
}

try {
  await waitForServer();

  const health = await (await get("/api/health")).json();
  assert.equal(health.ok, true);
  assert.equal(health.firebase, false);
  assert.equal(health.database, false);
  assert.equal(health.stripe, false);
  assert.equal(health.fulfillment, false);
  assert.equal(health.proof, false);
  assert.equal(health.social, false);

  const homepage = await (await get("/")).text();
  assert.match(homepage, /Launch your/i);
  assert.match(homepage, /The Anti-Balcony/i);
  assert.match(homepage, /public startup-launch platform/i);

  const launchPage = await (await get("/launch")).text();
  assert.match(launchPage, /RING IN YOUR STARTUP/i);
  assert.match(launchPage, /WHAT DOES THE STARTUP DO/i);

  const categoryPage = await (await get("/startup-launch")).text();
  assert.match(categoryPage, /startup launch/i);

  const launchesPage = await (await get("/launches")).text();
  assert.match(launchesPage, /public/i);

  const guides = [
    "how-to-launch-a-startup",
    "product-launch-checklist",
    "product-launch-plan",
    "build-in-public",
    "how-to-launch-on-product-hunt",
    "product-hunt-alternatives",
    "product-hunt-launch-checklist",
    "where-to-launch-your-startup",
    "startup-launch-announcement",
  ];
  for (const slug of guides) {
    const html = await (await get(`/guides/${slug}`)).text();
    assert.match(html, /launch/i, `guide ${slug} should contain launch content`);
  }

  await get("/guides/does-not-exist", 404);
  await get("/launches/does-not-exist", 404);
  await get("/api/rings/does-not-exist/badge", 404);

  const robots = await (await get("/robots.txt")).text();
  assert.match(robots, /Sitemap:/i);

  const sitemap = await (await get("/sitemap.xml")).text();
  assert.match(sitemap, /startup-launch/);
  assert.match(sitemap, /guides\/product-launch-checklist/);
  assert.match(sitemap, /launches/);

  const ringsList = await (await get("/api/rings")).json();
  assert.deepEqual(ringsList.rings, []);

  const invalidName = await postJson("/api/rings", { startupName: "A" }, 400);
  assert.match((await invalidName.json()).error, /2–80 characters/);

  const invalidScheme = await postJson("/api/rings", {
    startupName: "Scheme Test",
    website: "ftp://example.com/file",
  }, 400);
  assert.match((await invalidScheme.json()).error, /HTTP or HTTPS/);

  const thin = await postJson("/api/rings", {
    startupName: "  Thin   Ring  ",
    website: "example.com",
    tagline: "A lightweight public launch.",
  }, 202);
  const thinData = await thin.json();
  assert.equal(thinData.persisted, false);
  assert.equal(thinData.ring.startupName, "Thin Ring");
  assert.equal(thinData.ring.website, "https://example.com/");
  assert.equal(thinData.ring.indexable, false);
  assert.match(thinData.ring.slug, /^thin-ring-[a-f0-9]{6}$/);

  const rich = await postJson("/api/rings", {
    startupName: "Rich Ring",
    website: "https://example.com",
    socialUrl: "https://linkedin.com/company/example",
    tagline: "A complete public startup launch.",
    category: "SaaS",
    whatItDoes: "Helps startup teams coordinate a public product launch.",
    intendedCustomer: "Early-stage startup founders and launch teams.",
    founder: "Test Founder",
    problem: "Startup launches are fragmented across temporary social posts.",
    story: "Built to give startup launches a permanent public artifact founders can keep sharing.",
    imageUrl: "https://example.com/product.jpg",
  }, 202);
  const richData = await rich.json();
  assert.equal(richData.persisted, false);
  assert.equal(richData.ring.indexable, true);
  assert.equal(richData.ring.status, "rung");
  assert.equal(richData.ring.tier, "free");

  const checkout = await postJson("/api/checkout", {
    startupName: "No Stripe Test",
    email: "founder@example.com",
    tier: "snapshot",
  }, 503);
  assert.match((await checkout.json()).error, /not configured/i);

  const unauthorized = await postJson("/api/fulfillment/callback", {
    ringId: "ring-test",
    status: "scheduled",
  }, 401, false);
  assert.match((await unauthorized.json()).error, /Unauthorized/);

  const badStatus = await postJson("/api/fulfillment/callback", {
    ringId: "ring-test",
    status: "paid",
  }, 400, true);
  assert.match((await badStatus.json()).error, /valid status/);

  const badAsset = await postJson("/api/fulfillment/callback", {
    ringId: "ring-test",
    status: "proof_ready",
    proofUrl: "file:///tmp/proof.png",
  }, 400, true);
  assert.match((await badAsset.json()).error, /Invalid asset URL/);

  const missingProof = await postJson("/api/fulfillment/callback", {
    ringId: "ring-test",
    status: "proof_ready",
  }, 400, true);
  assert.match((await missingProof.json()).error, /requires a proofUrl/);

  for (const status of ["ops_review", "scheduled", "live", "failed"]) {
    const response = await postJson("/api/fulfillment/callback", {
      ringId: "ring-test",
      startupName: "Callback Test",
      status,
    }, 503, true);
    assert.match((await response.json()).error, /database is unavailable/i);
  }

  const proofReadyWithoutDatabase = await postJson("/api/fulfillment/callback", {
    ringId: "ring-test",
    startupName: "Proof Test",
    status: "proof_ready",
    proofUrl: "https://example.com/proof.png",
    videoUrl: "https://example.com/video.mp4",
  }, 503, true);
  assert.match((await proofReadyWithoutDatabase.json()).error, /database is unavailable/i);

  console.log("nonpayment-smoke: PASS");
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
