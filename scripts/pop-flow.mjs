// Isolated HTTP integration test. Real Next routes + real Supabase SDK against a
// local PostgREST test double. Does NOT prove PostgreSQL/RLS or live integrations.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { fileURLToPath } from "node:url";

const tables = { anti_balcony_pop_requests: [], anti_balcony_pop_cards: [] };
const database = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const tableName = url.pathname.split("/").at(-1);
    const table = tables[tableName];
    if (!table) { res.writeHead(404); res.end(JSON.stringify({ code: "42P01" })); return; }
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : null;
    const match = (row) => [...url.searchParams].every(([key, value]) => {
      if (["select", "order", "limit", "on_conflict"].includes(key)) return true;
      const [op, ...rest] = value.split("."); const target = rest.join(".");
      return op === "eq" ? String(row[key]) === target : op === "neq" ? String(row[key]) !== target : true;
    });
    let result;
    if (req.method === "POST") {
      for (const row of Array.isArray(body) ? body : [body]) {
        const duplicate = table.find(old => tableName === "anti_balcony_pop_requests" ? old.submission_key === row.submission_key : old.request_id === row.request_id && old.ordinal === row.ordinal);
        if (duplicate && !req.headers.prefer?.includes("ignore-duplicates")) { res.writeHead(409, { "Content-Type": "application/json" }); res.end(JSON.stringify({ code: "23505", message: "duplicate" })); return; }
        if (!duplicate) table.push(row);
      }
      result = body;
    } else if (req.method === "PATCH") {
      result = table.filter(match); result.forEach(row => Object.assign(row, body));
    } else result = table.filter(match);
    if (Array.isArray(result)) {
      const order = url.searchParams.get("order");
      if (order) { const [field, direction] = order.split("."); result = [...result].sort((a,b) => (a[field] > b[field] ? 1 : a[field] < b[field] ? -1 : 0) * (direction === "desc" ? -1 : 1)); }
      result = result.slice(0, Number(url.searchParams.get("limit") || result.length));
      const select = url.searchParams.get("select");
      if (select && select !== "*") result = result.map(row => Object.fromEntries(select.split(",").map(key => [key, row[key]])));
    }
    res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify(result));
  } catch (error) { res.writeHead(500); res.end(JSON.stringify({ message: String(error) })); }
});
database.listen(0, "127.0.0.1"); await once(database, "listening");
const base = "http://127.0.0.1:3108";
const secret = "pop-local-test-ops-secret";
const server = spawn(process.execPath, [fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url)), "start", "-H", "127.0.0.1", "-p", "3108"], {
  env: { ...process.env, NEXT_PUBLIC_SITE_URL: base, POP_INTAKE_ENABLED: "true", OPS_API_SECRET: secret,
    SUPABASE_URL: `http://127.0.0.1:${database.address().port}`, SUPABASE_SECRET_KEY: "local-test-only-key", SUPABASE_SERVICE_ROLE_KEY: "", RESEND_API_KEY: "", STRIPE_SECRET_KEY: "" },
  stdio: ["ignore", "pipe", "pipe"],
});
let logs = ""; server.stdout.on("data", chunk => logs += chunk); server.stderr.on("data", chunk => logs += chunk);
async function request(path, body, status = 200, authenticated = false) {
  const response = await fetch(`${base}${path}`, { ...(body === undefined ? {} : { method: "POST", body: JSON.stringify(body) }), headers: { "Content-Type": "application/json", ...(authenticated ? { Authorization: `Bearer ${secret}` } : {}) } });
  const content = await response.text();
  assert.equal(response.status, status, `${path}: ${content.slice(0, 500)}`);
  return response.headers.get("content-type")?.includes("application/json") ? JSON.parse(content) : content;
}
const submission = (overrides = {}) => ({ submissionKey: randomUUID(), offer: "free", totalCards: 0, title: "Our test celebration", email: "private-test@example.com", occasion: "Company milestone", celebration: "Team cheer", momentDate: "2026-08-28", sourceUrl: "https://www.youtube.com/watch?v=example", rightsAccepted: true, privacyAcknowledged: true, publicConsent: true, ...overrides });
try {
  const deadline = Date.now() + 45000;
  while (true) {
    if (server.exitCode !== null) throw new Error(logs);
    try { if ((await fetch(`${base}/api/health`)).ok) break; } catch {}
    if (Date.now() > deadline) throw new Error(`Server timeout: ${logs}`);
    await new Promise(r => setTimeout(r, 250));
  }
  assert.equal((await request("/api/health")).popIntake, true);
  const home = await request("/");
  assert.match(home, /Celebrate it\. Show it/); assert.match(home, /\$199/); assert.match(home, /\$549/);
  assert.doesNotMatch(home, /\$399|\$799|\$2,999|\$9,999/);
  assert.match(await request("/capture-guide"), /Keep the originals/);
  assert.match(await request("/launch?offer=keep"), /Estimated subtotal/);
  assert.match(await request("/launch?tier=vip"), /no longer available/);
  await request("/api/checkout", {}, 410); await request("/api/orders", {}, 410);
  await request("/api/rings", {}, 410);
  await request("/api/operations/pop", undefined, 401);
  await request("/api/operations/pop/unknown", { action: "publish" }, 401);
  await request("/api/pop", { junk: "x".repeat(13000) }, 413);
  await request("/api/pop", submission({ sourceUrl: "https://bad.test/" }), 400);
  const free = submission(); const saved = await request("/api/pop", free, 201);
  assert.equal(tables.anti_balcony_pop_requests.length, 1);
  assert.equal((await request("/api/pop", free, 201)).reference, saved.reference);
  assert.equal(tables.anti_balcony_pop_requests.length, 1);
  await request("/api/pop", { ...free, title: "Changed duplicate" }, 409);
  await request(`/moments/${saved.reference}`, undefined, 404);
  assert.doesNotMatch(await request("/moments"), /Our test celebration/);
  await request(`/api/operations/pop/${saved.reference}`, { action: "publish" }, 400, true);
  await request(`/api/operations/pop/${saved.reference}`, { action: "publish", linkReviewed: true }, 200, true);
  const publicPage = await request(`/moments/${saved.reference}`);
  assert.match(publicPage, /name="robots" content="noindex, nofollow"/);
  assert.match(publicPage, /Our test celebration/); assert.doesNotMatch(publicPage, /private-test@example.com|submission_key|payload_hash/);
  assert.match(await request("/moments"), /Our test celebration/);
  const keep = await request("/api/pop", submission({ offer: "keep", totalCards: 50, sourceUrl: null, subtotalCents: 1 }), 201);
  assert.equal(keep.quote.subtotalCents, 78700); assert.equal(keep.quote.extraCards, 49);
  await request(`/api/operations/pop/${keep.reference}`, { action: "publish", linkReviewed: true }, 400, true);
  await request(`/api/operations/pop/${keep.reference}`, { action: "complete" }, 400, true);
  await request(`/api/operations/pop/${keep.reference}`, { action: "start_production" }, 400, true);
  await request(`/api/operations/pop/${keep.reference}`, { action: "start_production", paymentHandled: true, customerApprovalConfirmed: true }, 200, true);
  const complete = { action: "complete", customerApprovalConfirmed: true, keylessAccessVerified: true, finalVideoUrl: "https://www.unikmo.com/memory/test-only" };
  await request(`/api/operations/pop/${keep.reference}`, { ...complete, keylessAccessVerified: false }, 400, true);
  await request(`/api/operations/pop/${keep.reference}`, { ...complete, finalVideoUrl: "https://evil.example/" }, 400, true);
  const ready = await request(`/api/operations/pop/${keep.reference}`, complete, 200, true);
  assert.equal(ready.cards.length, 50); assert.equal(new Set(ready.cards.map(c => c.token)).size, 50);
  assert.deepEqual((await request(`/api/operations/pop/${keep.reference}`, complete, 200, true)).cards, ready.cards);
  const cardPage = await request(`/m/${ready.cards[0].token}`);
  assert.match(cardPage, /Open your UNIKMO memory/);
  assert.match(cardPage, /name="robots" content="noindex, nofollow"/);
  await request(`/api/operations/pop/${keep.reference}`, { action: "revoke_card", ordinal: 1 }, 200, true);
  await request(`/m/${ready.cards[0].token}`, undefined, 404);
  await request(`/m/${ready.cards[1].token}`);
  const nasdaq = await request("/api/pop", submission({ offer: "nasdaq", totalCards: 1, capturePendingAccepted: true }), 201);
  assert.equal(nasdaq.status, "capture_pending");
  const start = { action: "start_production", paymentHandled: true, customerApprovalConfirmed: true };
  await request(`/api/operations/pop/${nasdaq.reference}`, start, 400, true);
  await request(`/api/operations/pop/${nasdaq.reference}`, { ...start, bookingRef: "TEST-NOT-REAL", captureLicenseRef: "TEST-NOT-REAL" }, 200, true);
  await request(`/api/operations/pop/${nasdaq.reference}`, complete, 400, true);
  await request(`/api/operations/pop/${nasdaq.reference}`, { ...complete, captureVerified: true }, 200, true);
  assert.equal((await request("/api/operations/pop", undefined, 200, true)).requests.length, 3);
  await request(`/api/operations/pop/${saved.reference}`, { action: "unpublish" }, 200, true);
  await request(`/moments/${saved.reference}`, undefined, 404);
  const invalidOrigin = await fetch(`${base}/api/pop`, { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://other.example" }, body: JSON.stringify(submission()) });
  assert.equal(invalidOrigin.status, 403);
  console.log("pop-flow: PASS — real routes, isolated test-double persistence, moderation, private requests, pricing, capture gates, 50 stable card links and revocation");
} finally {
  server.kill("SIGTERM");
  await new Promise(resolve => { const timer = setTimeout(() => { server.kill("SIGKILL"); resolve(); }, 3000); server.once("exit", () => { clearTimeout(timer); resolve(); }); });
  database.closeAllConnections(); database.close();
}
