import { test, expect } from "@playwright/test";

test.use({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  hasTouch: true,
  isMobile: true,
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
});

test("mobile home renders the mixed snap feed", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBeLessThan(400);
  await expect(page.getByTestId("mobile-feed")).toBeVisible();
  const snap = page.getByTestId("mobile-snap-container");
  await expect(snap).toBeVisible();
  await expect(snap.locator("section").first()).toBeVisible();
  const sourceButton = page.getByRole("button", { name: /every source/i });
  await expect(sourceButton).toBeVisible();
  await sourceButton.click();
  await expect(page.getByRole("heading", { name: "Choose your scroll" })).toBeVisible();
  await page.getByRole("button", { name: /Wikipedia/ }).click();
  await expect(page.getByRole("button", { name: /Wikipedia/ })).toBeVisible();
  await page.locator('section[aria-label^="Wikipedia:"] button[aria-label^="Open "]').first().click();
  await expect(page.getByRole("dialog", { name: /details$/ })).toBeVisible();
  await page.getByRole("button", { name: "Close details" }).click();
  await expect(page.getByRole("dialog", { name: /details$/ })).not.toBeVisible();
});

test("legacy query keeps the wiki mobile feed available", async ({ page }) => {
  await page.goto("/?legacy=1");
  await expect(page.getByText(/scroller · wiki/i)).toBeVisible();
});
