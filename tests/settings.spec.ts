import { test, expect } from "@playwright/test";

// BYOK settings: persist a single JSON blob under localStorage.byok and clear it.
test("settings saves the BYOK config to localStorage and clears it", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.removeItem("byok"));
  await page.goto("/settings");

  await page.getByTestId("provider-select").selectOption("openai");
  // Label tracks the selected provider.
  await expect(page.getByTestId("apikey-label")).toContainText(/OpenAI API key/i);

  await page.getByTestId("apikey-input").fill("sk-demo-123");
  await page.getByTestId("model-select").selectOption("gpt-4o");
  await page.getByTestId("save-byok").click();

  const saved = await page.evaluate(() => window.localStorage.getItem("byok"));
  expect(saved).not.toBeNull();
  const parsed = JSON.parse(saved!);
  expect(parsed).toMatchObject({ provider: "openai", apiKey: "sk-demo-123", model: "gpt-4o" });

  await page.getByTestId("clear-byok").click();
  const cleared = await page.evaluate(() => window.localStorage.getItem("byok"));
  expect(cleared).toBeNull();
});

// Model options update when the provider changes.
test("model dropdown updates options when provider changes", async ({ page }) => {
  await page.goto("/settings");

  await page.getByTestId("provider-select").selectOption("anthropic");
  await expect(page.getByTestId("model-select")).toContainText("claude-haiku-4-5");

  await page.getByTestId("provider-select").selectOption("google");
  await expect(page.getByTestId("apikey-label")).toContainText(/Google API key/i);
  await expect(page.getByTestId("model-select")).toContainText("gemini-2.0-flash");
});
