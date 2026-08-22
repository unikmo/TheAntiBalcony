import { expect, test, type Page } from "@playwright/test";

function captureRuntimeErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

test("homepage loads cleanly and explains the category", async ({ page }) => {
  const errors = captureRuntimeErrors(page);
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Launch your startup in public/i })).toBeVisible();
  await expect(page.getByText(/public startup-launch platform built around a shareable launch ritual called a Ring/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /Ring in your startup/i }).first()).toBeVisible();

  expect(errors).toEqual([]);
});

test("bell CTA carries a visitor into the launch flow", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Ring in your startup/i }).first().click();
  await expect(page).toHaveURL(/\/launch$/);
  await expect(page.getByText(/Create your public Ring/i)).toBeVisible();
});

test("package selection preserves the intended tier", async ({ page }) => {
  await page.goto("/");
  const clipCard = page.locator("article").filter({ hasText: "THE CLIP" });
  await expect(clipCard).toBeVisible();
  await clipCard.getByRole("button", { name: /Start your launch/i }).click();
  await expect(page).toHaveURL(/\/launch\?tier=video$/);
});

test("complete Ring form reaches the success state without Stripe or Firebase", async ({ page }) => {
  const errors = captureRuntimeErrors(page);
  await page.goto("/launch");

  await page.getByLabel("STARTUP NAME").fill("Browser Test Startup");
  await page.getByLabel("ONE-LINE LAUNCH SIGNAL").fill("A public startup launch tested end to end.");
  await page.getByLabel("WEBSITE").fill("https://example.com");
  await page.getByLabel("SOCIAL LINK").fill("https://linkedin.com/company/example");
  await page.getByLabel("WHAT DOES THE STARTUP DO?").fill("Helps founders coordinate and preserve a public startup launch.");
  await page.getByLabel("WHO IS IT FOR?").fill("Startup founders and launch teams.");
  await page.getByLabel("FOUNDER OR TEAM").fill("Browser Test Team");
  await page.getByLabel("PRODUCT IMAGE URL").fill("https://example.com/product.jpg");
  await page.getByLabel("WHAT PROBLEM ARE YOU SOLVING?").fill("Launch activity becomes fragmented across temporary channels.");
  await page.getByLabel("SHORT FOUNDER STORY").fill("We built this to give founders a permanent launch artifact they can keep sharing.");

  await page.getByRole("button", { name: /Ring in your startup/i }).click();

  await expect(page.getByText("YOUR RING EXISTS")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Browser Test Startup has entered the public record/i })).toBeVisible();
  await expect(page.getByText(/eligible for search indexing/i)).toBeVisible();
  await expect(page.getByText(/Firebase is not connected/i)).toBeVisible();

  expect(errors).toEqual([]);
});

test("launch directory is reachable from the homepage", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Explore launches/i }).click();
  await expect(page).toHaveURL(/\/launches$/);
  await expect(page.getByRole("heading", { name: /launch/i })).toBeVisible();
});

test("mobile hero keeps the core action visible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Launch your startup in public/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Ring in your startup/i }).first()).toBeVisible();
  await expect(page.locator(".ab2-bell")).toBeVisible();
});
