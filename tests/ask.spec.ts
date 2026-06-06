import { test, expect } from "@playwright/test";

// AC3 + BYOK gate: with no key, the live-AI path is disabled and the hint is shown.
test("ask page shows the BYOK hint when no provider key is configured", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.removeItem("byok"));
  await page.goto("/ask");

  await expect(page.getByTestId("byok-hint")).toBeVisible();
  await expect(page.getByTestId("byok-hint")).toContainText(/Settings to enable live AI/i);
});

// AC3 happy path: with a (mock) key set, the box returns a coherent, data-grounded answer.
test("ask box returns a data-grounded answer when a key is set", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "byok",
      JSON.stringify({ provider: "mock", apiKey: "test", model: "mock" }),
    );
  });
  await page.goto("/ask");

  // Hint is gone once a provider is configured.
  await expect(page.getByTestId("byok-hint")).toHaveCount(0);

  await page.getByTestId("ask-input").fill("What is the top selling product?");
  await page.getByTestId("ask-submit").click();

  const answer = page.getByTestId("ask-answer");
  await expect(answer).toBeVisible();
  // Answer is grounded in the real dataset: it names an actual product.
  await expect(answer).toContainText(/Espresso|Latte|Croissant|Cold Brew|Muffin|Bagel|Oat Milk|Cookie/i);
});

// Edge case: empty question is rejected gracefully.
test("ask box ignores an empty question", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "byok",
      JSON.stringify({ provider: "mock", apiKey: "test", model: "mock" }),
    );
  });
  await page.goto("/ask");
  await page.getByTestId("ask-submit").click();
  await expect(page.getByTestId("ask-answer")).toHaveCount(0);
});
