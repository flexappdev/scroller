import { expect, test } from "@playwright/test";

test("MediaAI feed keeps its random order while infinite pages append", async ({ page }) => {
  test.setTimeout(60_000);
  // The feed behavior is under test, not downloading every full-resolution S3 asset.
  await page.route(/\.s3\.amazonaws\.com\//, (route) => route.abort());

  const apiResponse = await page.request.get("/api/mediai?offset=0&limit=220");
  expect(apiResponse.ok()).toBeTruthy();
  const chronologicalTopics = ((await apiResponse.json()) as { items: Array<{ topic: string }> }).items.map(
    (item) => item.topic,
  );

  // Keep pagination deterministic: the live collection can legitimately have
  // a full first raw page whose next page only repeats the same grouped topics.
  await page.route(/\/api\/mediai\?/, async (route) => {
    const offset = Number(new URL(route.request().url()).searchParams.get("offset") || 0);
    const topic = `E2E appended topic ${offset}`;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        items: [{
          id: `topic:${topic}`,
          assetId: `e2e-${offset}`,
          topic,
          imageUrl: null,
          videoUrls: [],
          audioUrl: null,
          sourceUrl: "https://example.com/e2e",
          updatedAt: Date.now() / 1000,
          assetCount: 1,
        }],
        nextOffset: null,
      }),
    });
  });

  const response = await page.goto("/");
  expect(response?.status()).toBeLessThan(400);

  const feed = page.getByTestId("mediai-feed");
  await expect(feed).toBeVisible();
  const scrollContainer = feed.locator("div.snap-y");

  const cards = feed.locator("section");
  const initialCount = await cards.count();
  expect(initialCount).toBeGreaterThan(20);
  const initialTopics = await cards.evaluateAll((nodes) =>
    nodes.slice(0, 10).map((node) => node.getAttribute("aria-label")),
  );
  expect(initialTopics).not.toEqual(chronologicalTopics.slice(0, 10));

  await page.getByRole("button", { name: "Shuffle MediaAI feed" }).click();
  const firstAfterShuffle = await cards.first().getAttribute("aria-label");
  expect(firstAfterShuffle).toBeTruthy();

  await scrollContainer.evaluate((element) => element.scrollTo(0, element.scrollHeight));
  await expect.poll(() => cards.count(), { timeout: 15_000 }).toBeGreaterThan(initialCount);

  expect(await cards.first().getAttribute("aria-label")).toBe(firstAfterShuffle);

  const labels = await cards.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("aria-label")));
  expect(new Set(labels).size).toBe(labels.length);
});
