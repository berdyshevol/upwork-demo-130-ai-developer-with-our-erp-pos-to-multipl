import type {
  Analytics,
  Dataset,
  ForecastPoint,
  ProductAnalytics,
} from "./types";

const LEAD_TIME_DAYS = 3; // supplier lead time used for the safety floor
const TARGET_COVER_DAYS = 10; // max shelf cover before we over-stock

function lastNDays(qtys: number[], n: number): number[] {
  return qtys.slice(Math.max(0, qtys.length - n));
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

// Linear-ish trend from the first half vs. second half of the window.
function trendFactor(qtys: number[]): number {
  if (qtys.length < 4) return 1;
  const half = Math.floor(qtys.length / 2);
  const early = mean(qtys.slice(0, half));
  const late = mean(qtys.slice(half));
  if (early <= 0) return 1;
  return Math.max(0.6, Math.min(1.5, late / early));
}

export function computeAnalytics(ds: Dataset): Analytics {
  // Group sales by product, preserving date order.
  const byProduct = new Map<string, number[]>();
  const dates = Array.from(new Set(ds.sales.map((s) => s.date))).sort();
  for (const p of ds.products) byProduct.set(p.id, []);
  for (const date of dates) {
    for (const p of ds.products) {
      const rec = ds.sales.find((s) => s.productId === p.id && s.date === date);
      byProduct.get(p.id)!.push(rec ? rec.quantity : 0);
    }
  }

  const onHandOf = new Map(ds.inventory.map((i) => [i.productId, i.onHand]));

  // First pass: per-product totals + inventory math.
  const draft = ds.products.map((product) => {
    const qtys = byProduct.get(product.id)!;
    const totalUnits = qtys.reduce((a, b) => a + b, 0);
    const totalRevenue = Math.round(totalUnits * product.unitPrice * 100) / 100;
    const avgDailyDemand = Math.round((totalUnits / Math.max(1, qtys.length)) * 100) / 100;
    const suggestedMin = Math.ceil(avgDailyDemand * LEAD_TIME_DAYS);
    const suggestedMax = Math.ceil(avgDailyDemand * TARGET_COVER_DAYS);
    const onHand = onHandOf.get(product.id) ?? 0;
    return {
      product,
      qtys,
      totalUnits,
      totalRevenue,
      avgDailyDemand,
      onHand,
      suggestedMin,
      suggestedMax,
      needsRestock: onHand < suggestedMin,
    };
  });

  // ABC classification by revenue Pareto (A=top 70%, B=next 20%, C=rest).
  const sorted = [...draft].sort((a, b) => b.totalRevenue - a.totalRevenue);
  const grand = sorted.reduce((a, b) => a + b.totalRevenue, 0) || 1;
  let cum = 0;
  const classOf = new Map<string, "A" | "B" | "C">();
  for (const row of sorted) {
    cum += row.totalRevenue;
    const pct = cum / grand;
    classOf.set(row.product.id, pct <= 0.7 ? "A" : pct <= 0.9 ? "B" : "C");
  }

  const perProduct: ProductAnalytics[] = draft
    .map(({ qtys, ...rest }) => ({ ...rest, abcClass: classOf.get(rest.product.id)! }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  const restock = perProduct.filter((p) => p.needsRestock);

  // Aggregate 7-day forecast: sum each product's projected daily demand.
  const forecast = buildForecast(draft.map((d) => d.qtys), dates);

  return {
    perProduct,
    forecast,
    restock,
    totals: {
      units: perProduct.reduce((a, b) => a + b.totalUnits, 0),
      revenue: Math.round(perProduct.reduce((a, b) => a + b.totalRevenue, 0) * 100) / 100,
      skuCount: perProduct.length,
      alertCount: restock.length,
    },
  };
}

function buildForecast(seriesPerProduct: number[][], dates: string[]): ForecastPoint[] {
  const lastDate = dates.length ? new Date(dates[dates.length - 1] + "T00:00:00Z") : new Date();

  // Per-product 7-day average + trend, then summed into a catalogue forecast.
  const projections = seriesPerProduct.map((qtys) => {
    const base = mean(lastNDays(qtys, 7));
    const trend = trendFactor(qtys);
    return { base, trend };
  });

  const points: ForecastPoint[] = [];
  for (let h = 1; h <= 7; h++) {
    let predicted = 0;
    for (const { base, trend } of projections) {
      // Trend compounds mildly over the horizon, then we round per product.
      predicted += Math.round(base * Math.pow(trend, h / 7));
    }
    const d = new Date(lastDate.getTime() + h * 86_400_000);
    // Confidence decays the further out we project.
    const confidence = Math.round((0.9 - (h - 1) * 0.05) * 100) / 100;
    points.push({ date: d.toISOString().slice(0, 10), predictedQty: predicted, confidence });
  }
  return points;
}
