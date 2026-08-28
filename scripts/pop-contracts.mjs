import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { quotePop, validatePopSubmission, validateSourceUrl, POP_OFFERS } from "../lib/pop-offers.ts";
import { heroSlideIndex, POP_HERO_INTERVAL_MS, POP_HERO_SLIDES } from "../lib/pop-hero.ts";

assert.equal(POP_HERO_INTERVAL_MS, 4000);
assert.equal(POP_HERO_SLIDES.length, 10);
assert.equal(new Set(POP_HERO_SLIDES.map(slide => slide.src)).size, 10);
assert.deepEqual(POP_HERO_SLIDES.map(slide => slide.label), ["Wedding", "Proposal", "Birthday", "Baby shower", "I love you", "Our memories", "Anniversary", "Graduation", "Launch", "Team win"]);
for (const slide of POP_HERO_SLIDES) {
  assert.match(slide.alt, /Illustrative Times Square/);
  assert.doesNotMatch(slide.src + slide.alt, /unikmo/i);
  assert.ok(slide.occasion.length > 0 && slide.occasion.length <= 30);
  assert.equal(slide.headline.length, 2);
  assert.ok(slide.headline.every(line => line.length <= 24));
  assert.ok(slide.invitation.length > 0 && slide.invitation.length <= 50);
  assert.doesNotMatch(slide.occasion + slide.headline.join(" ") + slide.invitation, /unikmo|guaranteed/i);
}
assert.equal(heroSlideIndex(-1), 9);
assert.equal(heroSlideIndex(10), 0);
assert.equal(heroSlideIndex(1), 1);

assert.deepEqual(Object.keys(POP_OFFERS), ["free", "keep", "nasdaq"]);
assert.equal(quotePop("keep", 1).subtotalCents, 19900);
assert.equal(quotePop("nasdaq", 1).subtotalCents, 54900);
assert.equal(quotePop("keep", 50).extraCards, 49);
assert.equal(quotePop("keep", 50).extraCents, 58800);
assert.equal(quotePop("keep", 50).subtotalCents, 78700);
assert.equal(quotePop("nasdaq", 50).subtotalCents, 113700);
assert.equal(quotePop("free", 0).subtotalCents, 0);
for (const count of [0, -1, 1.5, NaN, Infinity, 501, "50"]) assert.throws(() => quotePop("keep", count));
assert.throws(() => quotePop("free", 1));
for (const offer of ["snapshot", "video", "takeover", "vip", "billboard", "__proto__"]) assert.throws(() => quotePop(offer, 1));
const base = { submissionKey: randomUUID(), offer: "free", totalCards: 0, title: "Maya’s graduation", email: "family@example.com", occasion: "Graduation", celebration: "Confetti", momentDate: "2026-08-28", sourceUrl: "https://www.youtube.com/watch?v=example", rightsAccepted: true, publicConsent: true, privacyAcknowledged: true };
assert.equal(validatePopSubmission(base).publicConsent, true);
for (const slide of POP_HERO_SLIDES) {
  assert.equal(validatePopSubmission({ ...base, occasion: slide.label }).occasion, slide.label, `Hero occasion must be accepted by intake: ${slide.label}`);
}
for (const key of ["rightsAccepted", "publicConsent", "privacyAcknowledged"]) assert.throws(() => validatePopSubmission({ ...base, [key]: false }));
for (const momentDate of ["2026-02-30", "2026-13-01", "August 28", ""]) assert.throws(() => validatePopSubmission({ ...base, momentDate }));
for (const url of ["javascript:alert(1)", "https://username:password@youtube.com/", "https://youtube.com.evil.test/", "https://localhost/test", "https://127.0.0.1/", "https://[::1]/", "http://youtube.com/test", "data:video/mp4;base64,test", "https://youtube.com:444/test"]) assert.throws(() => validateSourceUrl(url, true));
assert.equal(validatePopSubmission({ ...base, offer: "keep", sourceUrl: null, totalCards: 50, subtotalCents: 1 }).quote.subtotalCents, 78700);
assert.equal(validatePopSubmission({ ...base, offer: "keep", totalCards: 1 }).publicConsent, false);
assert.throws(() => validatePopSubmission({ ...base, offer: "nasdaq", totalCards: 1 }), /licensed capture/);
assert.equal(validatePopSubmission({ ...base, offer: "nasdaq", totalCards: 1, capturePendingAccepted: true }).offer, "nasdaq");
console.log("pop-contracts: PASS — pricing, quantity boundaries, links, consent, dates and retired offers");
