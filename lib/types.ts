export type AbcClass = "A" | "B" | "C";

export interface Product {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
}

export interface SalesRecord {
  id: string;
  productId: string;
  date: string; // YYYY-MM-DD
  quantity: number;
  revenue: number;
}

export interface InventoryLevel {
  productId: string;
  onHand: number;
}

export interface Dataset {
  seed: number;
  products: Product[];
  sales: SalesRecord[];
  inventory: InventoryLevel[];
}

export interface ForecastPoint {
  date: string;
  predictedQty: number;
  confidence: number;
}

export interface ProductAnalytics {
  product: Product;
  totalUnits: number;
  totalRevenue: number;
  abcClass: AbcClass;
  avgDailyDemand: number;
  onHand: number;
  suggestedMin: number;
  suggestedMax: number;
  needsRestock: boolean;
}

export interface Analytics {
  perProduct: ProductAnalytics[];
  forecast: ForecastPoint[]; // aggregate 7-day forecast across the catalogue
  restock: ProductAnalytics[];
  totals: { units: number; revenue: number; skuCount: number; alertCount: number };
}
