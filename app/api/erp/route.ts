import { NextResponse } from "next/server";
import { generateDataset } from "@/lib/data";

// Mock ERP endpoint — the single data source the dashboard reads from.
// Swap this handler for a real ERP/POS API and nothing else needs to change.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const seedParam = Number(searchParams.get("seed"));
  const seed = Number.isFinite(seedParam) && seedParam > 0 ? Math.floor(seedParam) : 1;

  const dataset = generateDataset(seed);
  return NextResponse.json(dataset, {
    headers: { "cache-control": "no-store" },
  });
}
