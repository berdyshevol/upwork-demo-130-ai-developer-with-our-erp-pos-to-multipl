import type { Byok } from "./byok";
import type { Analytics } from "./types";

// Compact, model-friendly summary of the live dataset for grounding answers.
export function datasetContext(a: Analytics): string {
  const lines = a.perProduct.map(
    (p) =>
      `${p.product.name} (${p.product.category}, class ${p.abcClass}): ` +
      `${p.totalUnits} units, $${p.totalRevenue} revenue, ` +
      `on-hand ${p.onHand}, min ${p.suggestedMin}, max ${p.suggestedMax}` +
      `${p.needsRestock ? ", NEEDS RESTOCK" : ""}`,
  );
  const f = a.forecast.reduce((s, p) => s + p.predictedQty, 0);
  return [
    `Catalogue of ${a.totals.skuCount} SKUs. Total ${a.totals.units} units / $${a.totals.revenue} over 30 days.`,
    `${a.totals.alertCount} SKU(s) below their restock minimum.`,
    `Projected 7-day demand: ${f} units.`,
    "",
    ...lines,
  ].join("\n");
}

// Deterministic, fully-local Q&A grounded in the dataset. Used for the default
// mock mode and as the offline fallback — no API key required.
export function heuristicAnswer(question: string, a: Analytics): string {
  const q = question.toLowerCase();
  const byUnits = [...a.perProduct].sort((x, y) => y.totalUnits - x.totalUnits);
  const byRevenue = [...a.perProduct].sort((x, y) => y.totalRevenue - x.totalRevenue);

  if (/(restock|reorder|low stock|out of stock|replenish)/.test(q)) {
    if (!a.restock.length) return "Every SKU is currently above its restock minimum — no reorders needed.";
    const list = a.restock
      .map((p) => `${p.product.name} (on-hand ${p.onHand} < min ${p.suggestedMin}, reorder up to ${p.suggestedMax})`)
      .join("; ");
    return `${a.restock.length} SKU(s) need restocking: ${list}.`;
  }

  if (/(class a|abc|classification|category|pareto|important)/.test(q)) {
    const a1 = a.perProduct.filter((p) => p.abcClass === "A").map((p) => p.product.name);
    return `Class A (top revenue) SKUs: ${a1.join(", ") || "none"}. ` +
      `These drive most revenue and should be prioritised for availability.`;
  }

  if (/(revenue|sales|money|earn|grossing|highest revenue)/.test(q)) {
    const top = byRevenue[0];
    return `Top revenue SKU is ${top.product.name} at $${top.totalRevenue} over the last 30 days. ` +
      `Total catalogue revenue is $${a.totals.revenue}.`;
  }

  if (/(forecast|next week|7 day|predict|demand|projection)/.test(q)) {
    const total = a.forecast.reduce((s, p) => s + p.predictedQty, 0);
    const peak = [...a.forecast].sort((x, y) => y.predictedQty - x.predictedQty)[0];
    return `Projected demand for the next 7 days is ${total} units, peaking on ${peak.date} ` +
      `at ${peak.predictedQty} units (confidence ${Math.round(peak.confidence * 100)}%).`;
  }

  // Default + "top selling" → best mover by units.
  const top = byUnits[0];
  return `The top selling product is ${top.product.name} with ${top.totalUnits} units sold ` +
    `(class ${top.abcClass}, $${top.totalRevenue} revenue). Runner-up: ${byUnits[1]?.product.name}.`;
}

// Live AI path via the Vercel AI SDK, BYOK, browser → provider directly.
// Provider packages are imported lazily so they never touch the SSR bundle.
export async function liveAnswer(byok: Byok, question: string, a: Analytics): Promise<string> {
  const { generateText } = await import("ai");
  const prompt =
    `You are an inventory analyst for a retail POS. Answer the question using ONLY the data below. ` +
    `Be concise and cite concrete numbers.\n\nDATA:\n${datasetContext(a)}\n\nQUESTION: ${question}`;

  let model;
  if (byok.provider === "anthropic") {
    const { createAnthropic } = await import("@ai-sdk/anthropic");
    model = createAnthropic({
      apiKey: byok.apiKey,
      headers: { "anthropic-dangerous-direct-browser-access": "true" },
    })(byok.model);
  } else if (byok.provider === "openai") {
    const { createOpenAI } = await import("@ai-sdk/openai");
    model = createOpenAI({ apiKey: byok.apiKey })(byok.model);
  } else if (byok.provider === "google") {
    const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
    model = createGoogleGenerativeAI({ apiKey: byok.apiKey })(byok.model);
  } else {
    return heuristicAnswer(question, a);
  }

  const { text } = await generateText({ model, prompt });
  return text.trim();
}

// Single entry point used by the UI.
export async function answerQuestion(
  byok: Byok | null,
  question: string,
  a: Analytics,
): Promise<string> {
  if (!byok || byok.provider === "mock") return heuristicAnswer(question, a);
  try {
    return await liveAnswer(byok, question, a);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "request failed";
    return `Live AI call failed (${msg}). Offline answer: ${heuristicAnswer(question, a)}`;
  }
}
