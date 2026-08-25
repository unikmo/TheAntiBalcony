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
  await expect(page.getByText(/Bell · Times Square · Your public Ring/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /Ring in your startup/i }).first()).toBeVisible();

  expect(errors).toEqual([]);
});

test("bell CTA carries a visitor into the launch flow", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Ring in your startup/i }).first().click();
  await expect(page).toHaveURL(/\/launch$/);
  await expect(page.getByRole("heading", { name: /Ring in your startup/i })).toBeVisible();
});

test("free package enters the base launch flow", async ({ page }) => {
  await page.goto("/");
  const freeCard = page.locator("#packages article", {
    has: page.getByRole("heading", { name: "THE RING", exact: true }),
  });
  await freeCard.getByRole("button", { name: /Create your Ring/i }).click();
  await expect(page).toHaveURL(/\/launch$/);
});

for (const item of [
  { name: "THE PROOF", tier: "snapshot" },
  { name: "THE CLIP", tier: "video" },
  { name: "THE MOMENT", tier: "takeover" },
  { name: "THE LEGEND", tier: "vip" },
]) {
  test(`${item.name} package preserves ${item.tier} tier`, async ({ page }) => {
    await page.goto("/");
    const card = page.locator("#packages article", {
      has: page.getByRole("heading", { name: item.name, exact: true }),
    });
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: /Start your launch/i }).click();
    await expect(page).toHaveURL(new RegExp(`/launch\\?tier=${item.tier}$`));
  });
}

test("complete Ring form submits every SEO field and returns indexable true", async ({ page }) => {
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

  const browserPayload = await page.locator("form.launch-form-grid").evaluate((form) =>
    Object.fromEntries(new FormData(form as HTMLFormElement).entries()),
  );
  for (const field of ["startupName", "category", "website", "socialUrl", "whatItDoes", "intendedCustomer", "founder", "imageUrl", "problem", "story"]) {
    expect(browserPayload[field], `browser form must submit ${field}`).toBeTruthy();
  }

  const responsePromise = page.waitForResponse((response) =>
    response.url().endsWith("/api/rings") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: /Ring in your startup/i }).click();
  const response = await responsePromise;
  const requestPayload = response.request().postDataJSON() as Record<string, unknown>;
  for (const field of ["startupName", "category", "website", "socialUrl", "whatItDoes", "intendedCustomer", "founder", "imageUrl", "problem", "story"]) {
    expect(requestPayload[field], `API request must contain ${field}`).toBeTruthy();
  }

  const responseData = await response.json() as { persisted: boolean; ring: { indexable: boolean; startupName: string } };
  expect(response.status()).toBe(202);
  expect(responseData.persisted).toBe(false);
  expect(responseData.ring.startupName).toBe("Browser Test Startup");
  expect(responseData.ring.indexable).toBe(true);

  await expect(page.getByText("YOUR RING EXISTS")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Browser Test Startup has entered the public record/i })).toBeVisible();
  await expect(page.getByTestId("ring-index-status")).toContainText(/eligible for search indexing/i);
  await expect(page.getByText(/Supabase is not connected/i)).toBeVisible();

  expect(errors).toEqual([]);
});

test("thin Ring stays noindex in the customer success state", async ({ page }) => {
  await page.goto("/launch");
  await page.getByLabel("STARTUP NAME").fill("Thin Browser Ring");

  const responsePromise = page.waitForResponse((response) =>
    response.url().endsWith("/api/rings") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: /Ring in your startup/i }).click();
  const response = await responsePromise;
  const data = await response.json() as { ring: { indexable: boolean } };
  expect(data.ring.indexable).toBe(false);
  await expect(page.getByTestId("ring-index-status")).toContainText(/remains noindex/i);
});

test("paid upgrade fails gracefully when Stripe is not configured", async ({ page }) => {
  await page.goto("/launch");
  await page.getByLabel("STARTUP NAME").fill("No Stripe Browser Test");
  await page.getByRole("button", { name: /Ring in your startup/i }).click();
  await expect(page.getByText("YOUR RING EXISTS")).toBeVisible();

  await page.getByLabel("Email for launch package delivery").fill("founder@example.com");
  const proofButton = page.locator(".upgrade-inline button").filter({ hasText: "THE PROOF" });
  await proofButton.click();
  await expect(page.getByText(/Paid checkout is not configured yet/i)).toBeVisible();
});

test("launch directory is reachable from the homepage", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Explore all launches/i }).click();
  await expect(page).toHaveURL(/\/launches$/);
  await expect(page.getByRole("heading", { name: /Explore launches/i })).toBeVisible();
});

test("mobile hero keeps the core action visible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Launch your startup in public/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Ring in your startup/i }).first()).toBeVisible();
  await expect(page.locator(".cinema-bell-button")).toBeVisible();
});
