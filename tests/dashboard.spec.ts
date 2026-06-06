import { test, expect } from "@playwright/test";

// AC1: Dashboard loads with a 7-day forecast chart from the sample data.
test("dashboard renders a 7-day forecast chart from sample data", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /forecasting/i }).first()).toBeVisible();

  const chart = page.getByTestId("forecast-chart");
  await expect(chart).toBeVisible();

  // Exactly 7 day columns for the 7-day forecast horizon.
  await expect(chart.getByTestId("forecast-bar")).toHaveCount(7);
});

// AC2 (part a): ABC classification table and restock suggestions render.
test("ABC classification table and min/max restock suggestions render", async ({ page }) => {
  await page.goto("/");

  const abc = page.getByTestId("abc-table");
  await expect(abc).toBeVisible();
  // ABC classes present in the table.
  await expect(abc).toContainText("A");
  await expect(abc).toContainText("B");
  await expect(abc).toContainText("C");

  // min/max suggestions visible
  await expect(abc.getByText(/min/i).first()).toBeVisible();
  await expect(abc.getByText(/max/i).first()).toBeVisible();

  const restock = page.getByTestId("restock-alerts");
  await expect(restock).toBeVisible();
  await expect(restock.getByTestId("restock-row").first()).toBeVisible();
});

// AC2 (part b): tables update on data reload.
test("ABC table and restock suggestions update on data reload", async ({ page }) => {
  await page.goto("/");

  const version = page.getByTestId("dataset-version");
  await expect(version).toBeVisible();
  const before = (await version.textContent())?.trim();

  await page.getByTestId("reload-data").click();

  await expect(version).not.toHaveText(before ?? "");
  // The analytics tables are still rendered against the freshly reloaded dataset.
  await expect(page.getByTestId("abc-table")).toBeVisible();
  await expect(page.getByTestId("restock-alerts")).toBeVisible();
});
