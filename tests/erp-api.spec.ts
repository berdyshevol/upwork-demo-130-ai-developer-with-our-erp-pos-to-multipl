import { test, expect } from "@playwright/test";

// AC4: /api/erp returns JSON, proving a clean API-driven data flow.
test("/api/erp returns a clean JSON dataset", async ({ request }) => {
  const res = await request.get("/api/erp");
  expect(res.ok()).toBeTruthy();
  expect(res.headers()["content-type"]).toContain("application/json");

  const body = await res.json();
  expect(Array.isArray(body.products)).toBeTruthy();
  expect(Array.isArray(body.sales)).toBeTruthy();
  expect(Array.isArray(body.inventory)).toBeTruthy();
  expect(body.products.length).toBeGreaterThan(0);

  // Shape proves it is swappable for a real ERP feed.
  const product = body.products[0];
  expect(product).toHaveProperty("id");
  expect(product).toHaveProperty("name");
  expect(product).toHaveProperty("category");

  const sale = body.sales[0];
  expect(sale).toHaveProperty("productId");
  expect(sale).toHaveProperty("date");
  expect(sale).toHaveProperty("quantity");
  expect(sale).toHaveProperty("revenue");
});

// AC4 edge case: the seed parameter drives a different dataset (reload flow).
test("/api/erp varies its dataset by seed", async ({ request }) => {
  const a = await (await request.get("/api/erp?seed=1")).json();
  const b = await (await request.get("/api/erp?seed=2")).json();
  expect(JSON.stringify(a.sales)).not.toEqual(JSON.stringify(b.sales));
});
