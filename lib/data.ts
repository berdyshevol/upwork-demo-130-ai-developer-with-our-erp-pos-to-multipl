import type { Dataset, Product, SalesRecord, InventoryLevel } from "./types";

// Deterministic PRNG so a given seed always yields the same dataset.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A small specialty-coffee POS catalogue — concrete, not lorem ipsum.
const CATALOG: Omit<Product, "id">[] = [
  { name: "Espresso Beans 1kg", category: "Beans", unitPrice: 24 },
  { name: "Cold Brew Bottle", category: "Drinks", unitPrice: 5.5 },
  { name: "Oat Milk Latte", category: "Drinks", unitPrice: 4.75 },
  { name: "Butter Croissant", category: "Bakery", unitPrice: 3.5 },
  { name: "Blueberry Muffin", category: "Bakery", unitPrice: 3.25 },
  { name: "Everything Bagel", category: "Bakery", unitPrice: 2.75 },
  { name: "Chocolate Chip Cookie", category: "Bakery", unitPrice: 2.5 },
  { name: "Oat Milk 1L", category: "Grocery", unitPrice: 3.95 },
];

const DAYS = 30;
const BASE_DATE = new Date("2026-05-01T00:00:00Z");

function dayString(offset: number): string {
  const d = new Date(BASE_DATE.getTime() + offset * 86_400_000);
  return d.toISOString().slice(0, 10);
}

// Each product gets a baseline daily demand + weekly seasonality + noise,
// so popularity varies enough to produce a real A/B/C spread.
export function generateDataset(seed: number): Dataset {
  const rng = mulberry32(seed * 7919 + 17);

  const products: Product[] = CATALOG.map((c, i) => ({
    id: `P${String(i + 1).padStart(2, "0")}`,
    ...c,
  }));

  const sales: SalesRecord[] = [];
  const inventory: InventoryLevel[] = [];

  products.forEach((p, idx) => {
    // Popularity tier: a couple of clear winners, a long tail of slow movers.
    const popularity = 4 + Math.floor(rng() * 40) * (idx < 3 ? 1.6 : idx < 5 ? 0.8 : 0.35);
    let totalUnits = 0;

    for (let d = 0; d < DAYS; d++) {
      const weekend = (d % 7 === 5 || d % 7 === 6) ? 1.35 : 1;
      const noise = 0.6 + rng() * 0.8;
      const qty = Math.max(0, Math.round(popularity * weekend * noise));
      totalUnits += qty;
      sales.push({
        id: `${p.id}-${d}`,
        productId: p.id,
        date: dayString(d),
        quantity: qty,
        revenue: Math.round(qty * p.unitPrice * 100) / 100,
      });
    }

    // On-hand stock: guarantee the catalogue's first SKU is short to surface
    // a restock alert, the rest are spread across healthy/low randomly.
    const avgDaily = totalUnits / DAYS;
    const coverDays = idx === 0 ? 1.5 : 1 + rng() * 11;
    inventory.push({ productId: p.id, onHand: Math.round(avgDaily * coverDays) });
  });

  return { seed, products, sales, inventory };
}
