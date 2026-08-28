import { expect, test } from "@playwright/test";
import { POP_HERO_SLIDES } from "../lib/pop-hero";

test("lean homepage explains POP without retired offers", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Celebrate it. Show it.");
  await expect(page.locator("#packages article")).toHaveCount(3);
  await expect(page.locator("#packages")).toContainText("$199");
  await expect(page.locator("#packages")).toContainText("$549");
  await expect(page.locator("#packages")).not.toContainText("$399");
  await expect(page.getByRole("button", { name: /ring the bell/i })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("Times Square carousel has distinct scenes and points to NASDAQ", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator(".pop-hero");
  await expect(hero).not.toContainText("UNIKMO");
  await expect(hero.locator(".pop-carousel-slide")).toHaveCount(10);
  const picker = hero.getByRole("combobox", { name: "Find your moment" });
  await expect(picker.locator("option")).toHaveCount(10);
  await picker.selectOption({ label: "I love you" });
  await expect(picker).toHaveValue("4");
  await expect(hero.locator(".pop-carousel-slide.is-active img")).toHaveAttribute("alt", /couple/);
  await expect(hero.getByRole("heading", { name: "Three little words. One giant gesture." })).toBeVisible();
  await expect(hero.getByRole("button", { name: "Play carousel" })).toBeVisible();
  await picker.selectOption({ label: "Anniversary" });
  await hero.getByRole("button", { name: "Next Times Square scene" }).press("ArrowRight");
  await expect(hero.locator(".pop-carousel-slide.is-active img")).toHaveAttribute("alt", /graduate/);
  await expect(hero.getByRole("heading", { name: "You earned this. Let it show." })).toBeVisible();
  await hero.getByRole("button", { name: "Next Times Square scene" }).press("Home");
  await expect(hero.locator(".pop-carousel-slide.is-active img")).toHaveAttribute("alt", /newlywed/);
  await expect(hero.getByRole("heading", { name: "Your forever. Up in lights." })).toBeVisible();
  await picker.selectOption({ label: "Launch" });
  await expect(hero.getByRole("heading", { name: "Your hard work. Up in lights." })).toBeVisible();
  await expect(hero.getByText("Picture your team in Times Square.")).toBeVisible();
  await expect(hero.getByRole("link", { name: "See yourself here" })).toHaveAttribute("href", "/launch?offer=nasdaq");
  await expect(page.locator("#packages article").first()).toHaveAttribute("id", "nasdaq");
});

test("reduced motion disables automatic carousel rotation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Automatic rotation off: reduced motion" })).toBeDisabled();
  await page.getByRole("button", { name: "Next Times Square scene" }).click();
  await expect(page.locator(".pop-carousel-slide.is-active img")).toHaveAttribute("alt", /proposal/);
});

test("every occasion opens its own image and invitation immediately", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator(".pop-hero");
  const picker = hero.getByRole("combobox", { name: "Find your moment" });
  for (const slide of POP_HERO_SLIDES) {
    await picker.selectOption({ label: slide.label });
    await expect(hero.locator(".pop-carousel-slide.is-active img")).toHaveAttribute("alt", slide.alt);
    await expect(hero.getByRole("heading", { name: slide.headline.join(" "), exact: true })).toBeVisible();
    await expect(hero.getByText(slide.invitation, { exact: true })).toBeVisible();
  }
  await hero.getByRole("button", { name: "Next Times Square scene" }).click();
  await expect(picker).toHaveValue("0");
});

test("preview loads video only after click and labels it as illustrative", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".pop-screen video")).toHaveCount(0);
  await page.getByRole("button", { name: "Play the illustrative NASDAQ preview" }).click();
  await expect(page.locator(".pop-screen video")).toBeVisible();
  await expect(page.locator(".pop-screen")).toContainText("Not footage of a booked placement");
});

test("keep request computes 50 cards and never opens checkout", async ({ page }) => {
  const checkoutCalls: string[] = [];
  page.on("request", request => { if (request.url().includes("/api/checkout")) checkoutCalls.push(request.url()); });
  await page.goto("/launch?offer=keep");
  await page.getByLabel("Total UNIKMO cards").fill("50");
  await expect(page.locator(".pop-summary")).toContainText("49 extra cards");
  await expect(page.locator(".pop-summary")).toContainText("$588");
  await expect(page.locator(".pop-summary")).toContainText("$787");
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  expect(checkoutCalls).toEqual([]);
});

test("NASDAQ is request-only and has an explicit capture acknowledgement", async ({ page }) => {
  await page.goto("/launch?offer=nasdaq");
  await expect(page.locator(".pop-alert")).toContainText("not a reservation");
  await expect(page.getByLabel(/licensed capture must be confirmed/)).toBeVisible();
});

test("free submission sends only a link and does not fabricate success when offline", async ({ page }) => {
  await page.goto("/launch");
  await page.getByLabel("Your moment", { exact: true }).fill("Maya’s graduation");
  await page.getByLabel("Your email").fill("test@example.com");
  await page.getByLabel("The occasion").selectOption("Graduation");
  await page.getByLabel("What’s your POP?").selectOption("Confetti");
  await page.getByLabel("Occasion date").fill("2026-08-28");
  await page.getByLabel("Your public video link").fill("https://www.youtube.com/watch?v=example");
  await page.getByLabel(/I have permission/).check();
  await page.getByLabel(/Publish my moment title/).check();
  await page.getByLabel(/I’ve read the privacy/).check();
  const pending = page.waitForResponse(r => r.url().endsWith("/api/pop"));
  await page.getByRole("button", { name: "Submit your POP for review" }).click();
  const response = await pending;
  expect(response.status()).toBe(503);
  const payload = response.request().postDataJSON();
  expect(payload.totalCards).toBe(0);
  expect(payload.sourceUrl).toContain("youtube.com");
  expect(payload.featureConsent).toBe(false);
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByText("Request saved", { exact: true })).toHaveCount(0);
});

test("successful intake displays review not publication or a booking", async ({ page }) => {
  await page.route("**/api/pop", route => route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ reference: "test-reference", status: "submitted" }) }));
  await page.goto("/launch?offer=keep");
  await page.getByLabel("Your moment", { exact: true }).fill("Our milestone");
  await page.getByLabel("Your email").fill("test@example.com");
  await page.getByLabel("The occasion").selectOption("Company milestone");
  await page.getByLabel("What’s your POP?").selectOption("Team cheer");
  await page.getByLabel("Occasion date").fill("2026-08-28");
  await page.getByLabel(/I have permission/).check();
  await page.getByLabel(/I’ve read the privacy/).check();
  await page.getByRole("button", { name: "Send your request" }).click();
  await expect(page.getByRole("status")).toContainText("No payment has been made");
  await expect(page.getByRole("status")).toContainText("test-reference");
});

for (const width of [375, 768, 1440]) {
  test(`responsive layout has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.goto("/launch?offer=keep");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}
