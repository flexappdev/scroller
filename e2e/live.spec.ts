import { expect, test } from "@playwright/test";

test("Scroller Live is private for anonymous visitors", async ({ page }) => {
  await page.goto("/live", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/login\?/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  expect(new URL(page.url()).searchParams.get("next")).toBe("/live");
});
