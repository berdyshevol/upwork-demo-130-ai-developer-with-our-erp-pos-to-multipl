# ERP/POS Forecast Studio

An AI forecasting & reporting demo that turns raw ERP/POS sales data into **7-day
demand forecasts**, **ABC product classification**, and **min/max restock
suggestions** — with a natural-language "Ask the data" panel on top.

It proves the data flow end to end: a mock ERP REST endpoint feeds an
auto-generated analytics dashboard, ready to swap for a real ERP/POS API.

## What it demonstrates

- **`/` Dashboard** — 7-day forecast chart, ABC classification table with min/max
  reorder bands, and live restock alerts. "Reload data" pulls a fresh dataset and
  recomputes everything.
- **`/data`** — the seeded sample dataset served from the mock ERP feed, with a
  reload control.
- **`/ask`** — natural-language Q&A grounded in the loaded dataset
  ("What is the top selling product?", "Which SKUs need restocking?").
- **`/settings`** — Bring-Your-Own-Key for the AI layer (Anthropic / OpenAI /
  Google) via the Vercel AI SDK. The key lives only in your browser's
  localStorage and calls the provider directly.
- **`/api/erp`** — mock ERP endpoint returning clean JSON
  (`products`, `sales`, `inventory`), the single data source the dashboard reads.

### AI is bring-your-own-key

Every screen except live LLM answers works with **no API key**. The forecast, ABC
classification, restock math and the "Ask the data" heuristics all run locally.
Add a provider key in Settings to upgrade "Ask the data" to live LLM responses —
the call goes from your browser straight to the provider, so only your account is
ever billed. No keys are stored or proxied server-side.

## Tech stack

- Next.js (App Router) + TypeScript + Server-side route handler for the mock ERP
- Tailwind CSS, shadcn-style UI primitives, dependency-free SVG chart
- Vercel AI SDK (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google`)
- Playwright behavioural tests, one per acceptance criterion

## Run locally

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

### Tests

```bash
pnpm exec playwright install --with-deps chromium   # once
pnpm test
```

### Production build

```bash
pnpm build
pnpm start
```

## How the forecast works

For each SKU we take a 7-day moving average of recent daily sales, apply a mild
trend factor (second half vs. first half of the 30-day window), and project it
across the next 7 days with decaying confidence. ABC classes come from a revenue
Pareto split (A ≤ 70%, B ≤ 90%, C rest); min/max bands use a lead-time floor and a
target shelf-cover ceiling. These deterministic heuristics keep the demo fast and
key-free; the same dataset context is what gets handed to the LLM in "Ask the
data" when a key is configured.
