import { test, expect } from "@playwright/test";

test.use({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  hasTouch: true,
  isMobile: true,
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
});

test("mobile home renders the immersive MediaAI snap feed", async ({ page }) => {
  await page.route(/\.s3\.amazonaws\.com\//, (route) => route.abort());
  const response = await page.goto("/");
  expect(response?.status()).toBeLessThan(400);
  const feed = page.getByTestId("mediai-feed");
  await expect(feed).toBeVisible();
  await expect(feed.locator("section").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Shuffle MediaAI feed" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open all Scroller sources" })).toHaveAttribute("href", "/browse");
});

test("browse route keeps the mixed-source browser available", async ({ page }) => {
  const response = await page.goto("/browse");
  expect(response?.status()).toBeLessThan(400);
  await expect(page.getByTestId("mobile-feed")).toBeVisible();
});
