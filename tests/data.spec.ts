import { test, expect } from "@playwright/test";

// /data screen: sample dataset view + reload control (drives AC2's "data reload").
test("data page shows the sample dataset and reloads it", async ({ page }) => {
  await page.goto("/data");

  const table = page.getByTestId("data-table");
  await expect(table).toBeVisible();
  await expect(table.getByTestId("data-row").first()).toBeVisible();

  const version = page.getByTestId("dataset-version");
  const before = (await version.textContent())?.trim();
  await page.getByTestId("reload-data").click();
  await expect(version).not.toHaveText(before ?? "");
  await expect(table.getByTestId("data-row").first()).toBeVisible();
});

// AC5 proxy: the app shell + navigation work end to end on a single deploy.
test("primary navigation reaches every screen", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /data/i }).first().click();
  await expect(page).toHaveURL(/\/data$/);

  await page.getByRole("link", { name: /ask/i }).first().click();
  await expect(page).toHaveURL(/\/ask$/);

  await page.getByRole("link", { name: /settings/i }).first().click();
  await expect(page).toHaveURL(/\/settings$/);
});
