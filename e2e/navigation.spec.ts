import { expect, test } from "@playwright/test";

const NAV = [
  { name: "Explore", path: "/explore", text: /Pick a Scroller/i },
  { name: "Gen", path: "/create", text: /Any topic/i },
  { name: "Saved", path: "/saved", text: /Your keep pile/i },
  { name: "Me", path: "/me", text: /Scroller settings/i },
];

test("five-button footer routes are functional", async ({ page }) => {
  await page.route(/\.s3\.amazonaws\.com\//, (route) => route.abort());
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("button", { name: /Home/ })).toBeVisible();

  for (const item of NAV) {
    await page.getByRole("link", { name: item.name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${item.path.replace("/", "\\/")}$`));
    await expect(page.locator("body")).toContainText(item.text);
  }
});

test("tapping Home again reshuffles the current feed", async ({ page }) => {
  await page.route(/\.s3\.amazonaws\.com\//, (route) => route.abort());
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const feed = page.getByTestId("mediai-feed");
  await expect(feed).toBeVisible();
  const cards = feed.locator("section");

  const before = await cards.evaluateAll((nodes) =>
    nodes.slice(0, 8).map((node) => node.getAttribute("aria-label")),
  );

  await page.getByRole("button", { name: /Refresh Home with a random Scroller/i }).click();

  await expect
    .poll(async () =>
      cards.evaluateAll((nodes) => nodes.slice(0, 8).map((node) => node.getAttribute("aria-label"))),
    )
    .not.toEqual(before);
});

test("saved page accepts a card saved from Home", async ({ page }) => {
  await page.route(/\.s3\.amazonaws\.com\//, (route) => route.abort());
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const firstCard = page.getByTestId("mediai-feed").locator("section").first();
  const topic = await firstCard.getAttribute("aria-label");
  expect(topic).toBeTruthy();

  await firstCard.getByRole("button", { name: "Save" }).click();
  await page.getByRole("link", { name: "Saved", exact: true }).click();

  await expect(page.getByRole("heading", { name: topic! })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open in Home" }).first()).toBeVisible();
});
