// Read-only checks against actual rendered pages. Does not submit user data.
// Optional URL argument supports post-deployment checks (no auth bypass).
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

const external = process.argv[2];
const base = external || "http://127.0.0.1:3112";
const preview = process.argv.includes("--preview");
const server = external ? null : spawn(process.execPath, [fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url)), "start", "-H", "127.0.0.1", "-p", "3112"], {
  env: { ...process.env, POP_INTAKE_ENABLED: "false", SUPABASE_URL: "", SUPABASE_SECRET_KEY: "", SUPABASE_SERVICE_ROLE_KEY: "", STRIPE_SECRET_KEY: "" }, stdio: ["ignore", "pipe", "pipe"],
});
let logs = "";
server?.stdout.on("data", chunk => logs += chunk);
server?.stderr.on("data", chunk => logs += chunk);
const decode = s => s.replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const tag = (html, name) => [...html.matchAll(/<meta\b[^>]*>/g)].find(([s]) => s.includes(`name="${name}"`) || s.includes(`property="${name}"`))?.[0].match(/content="([^"]*)"/)?.[1];
const canonical = html => html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
const graph = html => [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(([, json]) => JSON.parse(json));
async function get(path, status = 200, userAgent = "OAI-SearchBot") {
  const response = await fetch(`${base}${path}`, { headers: { "User-Agent": userAgent }, redirect: "manual", signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, status, `${path}: HTTP ${response.status}`);
  const html = await response.text();
  if (preview) assert.match(response.headers.get("x-robots-tag") || "", /noindex/, `Preview must not index ${path}`);
  return { response, html };
}

try {
  if (server) {
    const deadline = Date.now() + 45000;
    while (true) {
      if (server.exitCode !== null) throw new Error(logs);
      try { if ((await fetch(`${base}/api/health`)).ok) break; } catch {}
      if (Date.now() > deadline) throw new Error(`Startup timeout: ${logs}`);
      await new Promise(r => setTimeout(r, 200));
    }
  }
  const { html: home } = await get("/");
  const origin = new URL(canonical(home)).origin;
  assert.equal((home.match(/<h1[ >]/g) || []).length, 1);
  assert.match(home, /Celebrate it\. Show it\./);
  const hero = home.match(/<section class="pop-hero pop-wrap"[\s\S]*?<\/section>/)?.[0];
  assert.ok(hero, "Times Square hero is server rendered");
  assert.doesNotMatch(hero, /UNIKMO|unikmo-lady|unikmo-card/);
  assert.match(hero, /href="\/launch\?offer=nasdaq"/);
  assert.match(hero, /aria-roledescription="carousel"/);
  for (const copy of ["Your hard work.", "Up in lights.", "Your love.", "Larger than life.", "You earned this.", "Let it show.", "Picture your team in Times Square.", "Imagine their face when they look up.", "A bigger stage for your next chapter."]) {
    assert.ok(hero.includes(copy), `Missing server-rendered hero copy: ${copy}`);
  }
  assert.equal((hero.match(/class="pop-carousel-story"/g) || []).length, 3);
  for (const scene of ["launch", "together", "graduation"]) {
    assert.ok(hero.includes(`pop-times-square-${scene}.webp`), `Missing ${scene} scene`);
    const { response } = await get(`/pop-times-square-${scene}.webp`);
    assert.match(response.headers.get("content-type"), /image\/webp/);
  }
  const nodes = graph(home).flatMap(item => item["@graph"] || [item]);
  for (const type of ["Organization", "Brand", "WebSite", "WebPage", "FAQPage", "Service"]) assert.ok(nodes.some(n => n["@type"] === type), type);
  const organization = nodes.find(n => n["@type"] === "Organization");
  assert.equal(organization.name, "The Pop Moment");
  assert.match(organization.description, /AntiBalcony/);
  assert.equal(nodes.find(n => n["@type"] === "Brand").url, "https://www.unikmo.com/");
  const services = nodes.filter(n => n["@type"] === "Service");
  assert.deepEqual(services.map(s => s.offers.price), [0, 199, 549]);
  for (const service of services) {
    assert.equal(service.offers.priceCurrency, "USD");
    assert.equal(service.offers.priceSpecification.valueAddedTaxIncluded, false);
    assert.ok(home.includes(`id="${new URL(service.url).hash.slice(1)}"`));
    assert.ok(!service.offers.availability, "Do not advertise unconfirmed inventory as available");
  }
  assert.match(services[2].description, /Request only/);
  assert.match(services[2].description, /licensed capture/);
  assert.ok(!JSON.stringify(nodes).includes("aggregateRating"));
  const faq = nodes.find(n => n["@type"] === "FAQPage");
  const visibleFaqs = [...home.matchAll(/<details><summary>(.*?)<\/summary><p>(.*?)<\/p><\/details>/gs)].map(([, q, a]) => [decode(q), decode(a)]);
  assert.deepEqual(visibleFaqs, faq.mainEntity.map(q => [q.name, q.acceptedAnswer.text]));
  for (const userAgent of ["Googlebot", "bingbot", "PerplexityBot"]) {
    const { html } = await get("/", 200, userAgent);
    assert.deepEqual(graph(html), graph(home), "No crawler cloaking");
  }
  const { html: sitemap } = await get("/sitemap.xml");
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(([, url]) => decode(url));
  if (preview) assert.equal(urls.length, 0);
  else {
    assert.equal(new Set(urls).size, urls.length);
    assert.ok(urls.includes(`${origin}/about`)); assert.ok(urls.includes(`${origin}/guides`));
    assert.ok(!urls.some(url => /\/m\/|\/moments\/|\/launch$|\?|\/api\//.test(url)));
    assert.doesNotMatch(sitemap, /<lastmod>/, "No synthetic freshness dates");
    for (const url of urls) {
      const path = new URL(url).pathname;
      const { html } = await get(path);
      assert.equal(new URL(canonical(html)).pathname, path, `Canonical mismatch: ${path}`);
      assert.ok(tag(html, "description"), `Missing description: ${path}`);
      assert.ok(!tag(html, "robots")?.includes("noindex"), `Sitemap contains noindex: ${path}`);
      assert.equal(new URL(tag(html, "og:url")).pathname, path);
      assert.equal(tag(html, "og:description"), tag(html, "description"));
      assert.equal(tag(html, "twitter:description"), tag(html, "description"));
    }
  }
  const { html: robots } = await get("/robots.txt");
  if (preview) assert.match(robots, /Disallow: \/\s*$/m);
  else {
    assert.match(robots, /OAI-SearchBot/); assert.match(robots, /PerplexityBot/);
    assert.match(robots, /Disallow: \/api\//);
    assert.ok(!/^Disallow: \/$/m.test(robots));
    assert.ok(!robots.includes("Disallow: /m/"), "noindex must remain crawlable");
  }
  const { html: llms, response: llmsResponse } = await get("/llms.txt");
  assert.match(llmsResponse.headers.get("content-type"), /text\/plain/);
  assert.match(llms, /\$199/); assert.match(llms, /\$549/);
  assert.doesNotMatch(llms, /\/m\/|\/api\/|\$399|\$799/);
  for (const { acceptedAnswer } of faq.mainEntity) assert.ok(llms.includes(acceptedAnswer.text));
  const { html: form, response: formResponse } = await get("/launch?offer=nasdaq");
  assert.match(tag(form, "robots"), /noindex/);
  assert.match(formResponse.headers.get("x-robots-tag"), /noindex/);
  assert.equal(canonical(form), `${origin}/launch`);
  for (const path of ["/m/not-a-real-token", "/moments/not-a-real-id"]) {
    const { response } = await get(path, 404);
    assert.match(response.headers.get("x-robots-tag"), /noindex/);
    assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  }
  await get("/guides/not-a-real-guide", 404);
  if (!external) {
    // Inspect build-time preview configuration without changing live env vars.
    const ts = await import("typescript");
    const source = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
    const config = (await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`)).default;
    const old = process.env.VERCEL_ENV; process.env.VERCEL_ENV = "preview";
    try { assert.ok((await config.headers()).some(r => r.source === "/:path*" && r.headers.some(h => h.key === "X-Robots-Tag" && h.value.includes("noindex")))); }
    finally { if (old === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = old; }
  }
  console.log(`discovery-check: PASS — ${urls.length} sitemap URLs, schema/FAQ parity, metadata, bot responses, privacy headers and preview isolation`);
} finally { server?.kill("SIGTERM"); }
