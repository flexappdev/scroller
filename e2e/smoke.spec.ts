import { test, expect } from "@playwright/test";

// v2.5 smoke suite — alive-check for the core public routes.
// Runs in default light mode; no data-theme override.

const ROUTES: Array<{ path: string; heading: RegExp }> = [
  { path: "/", heading: /scroller/i },
  { path: "/wiki", heading: /wiki/i },
  { path: "/diagrams", heading: /diagrams/i },
  { path: "/about", heading: /one feed/i },
  { path: "/version", heading: /release|version/i },
];

for (const { path, heading } of ROUTES) {
  test(`GET ${path} → 200 + heading renders`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status(), `status for ${path}`).toBeLessThan(400);
    await expect(page.locator("h1,h2,h3").first()).toBeVisible();
    await expect(page.locator("body")).toContainText(heading);
  });
}

test("light mode is the default theme on first visit", async ({ page }) => {
  await page.goto("/");
  const theme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  expect(theme).toBe("light");
});

test("/diagrams renders 8 SVG panels", async ({ page }) => {
  await page.goto("/diagrams");
  const svgs = page.locator("main svg[role='img']");
  await expect(svgs).toHaveCount(8);
});

test("numeric Wikipedia item IDs resolve through the Action API", async ({ page }) => {
  const response = await page.goto("/items/wiki%3A1306825");
  expect(response?.status()).toBeLessThan(400);
  await expect(page.getByRole("heading", { name: "Ruabon" })).toBeVisible();
  await expect(page.getByText("Item not found")).not.toBeVisible();
  await expect(page.getByRole("link", { name: "Read on Wikipedia" })).toHaveAttribute(
    "href",
    "https://en.wikipedia.org/wiki/Ruabon",
  );
});
