"use client";

import { useDataset } from "@/lib/use-dataset";
import { Card, CardHeader, CardBody, ClassBadge, Button } from "@/components/ui";
import { ForecastChart } from "@/components/forecast-chart";

export default function DashboardPage() {
  const { seed, analytics, loading, error, reload } = useDataset();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            AI Forecasting Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Turning raw ERP/POS sales into 7-day forecasts, ABC classes and restock
            alerts. <span data-testid="dataset-version" className="font-medium text-slate-700">Dataset #{seed}</span>
          </p>
        </div>
        <Button testId="reload-data" variant="outline" onClick={reload}>
          ↻ Reload data
        </Button>
      </div>

      {error && (
        <Card className="border-red-200">
          <CardBody className="text-sm text-red-700">Failed to load ERP feed: {error}</CardBody>
        </Card>
      )}

      {analytics && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="SKUs tracked" value={String(analytics.totals.skuCount)} />
            <Stat label="Units (30d)" value={analytics.totals.units.toLocaleString()} />
            <Stat label="Revenue (30d)" value={`$${analytics.totals.revenue.toLocaleString()}`} />
            <Stat label="Restock alerts" value={String(analytics.totals.alertCount)} accent />
          </div>

          <Card>
            <CardHeader
              title="7-day demand forecast"
              subtitle="Catalogue-wide projected units, moving average + trend per SKU"
            />
            <CardBody>
              <ForecastChart points={analytics.forecast} />
            </CardBody>
          </Card>

          <div className="grid gap-6 lg:grid-cols-5">
            <Card testId="abc-table" className="lg:col-span-3">
              <CardHeader title="ABC classification & min/max" subtitle="By revenue Pareto; suggested reorder band" />
              <CardBody className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="py-2 pr-3">Class</th>
                      <th className="py-2 pr-3">Product</th>
                      <th className="py-2 pr-3 text-right">Units</th>
                      <th className="py-2 pr-3 text-right">Revenue</th>
                      <th className="py-2 pr-3 text-right">On-hand</th>
                      <th className="py-2 pr-3 text-right">Min</th>
                      <th className="py-2 text-right">Max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.perProduct.map((p) => (
                      <tr key={p.product.id} className="border-b border-slate-50">
                        <td className="py-2 pr-3"><ClassBadge value={p.abcClass} /></td>
                        <td className="py-2 pr-3 font-medium text-slate-800">{p.product.name}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{p.totalUnits}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">${p.totalRevenue}</td>
                        <td className={`py-2 pr-3 text-right tabular-nums ${p.needsRestock ? "font-semibold text-red-600" : ""}`}>{p.onHand}</td>
                        <td className="py-2 pr-3 text-right tabular-nums text-slate-500">{p.suggestedMin}</td>
                        <td className="py-2 text-right tabular-nums text-slate-500">{p.suggestedMax}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>

            <Card testId="restock-alerts" className="lg:col-span-2">
              <CardHeader title="Restock alerts" subtitle="SKUs below their lead-time minimum" />
              <CardBody className="space-y-3">
                {analytics.restock.length === 0 && (
                  <p className="text-sm text-slate-500">All SKUs are above their minimum. ✅</p>
                )}
                {analytics.restock.map((p) => (
                  <div
                    key={p.product.id}
                    data-testid="restock-row"
                    className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/60 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">{p.product.name}</p>
                      <p className="text-xs text-slate-500">
                        on-hand {p.onHand} · min {p.suggestedMin}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-red-600">Reorder</p>
                      <p className="text-sm font-semibold tabular-nums text-slate-800">
                        +{Math.max(0, p.suggestedMax - p.onHand)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>
        </>
      )}

      {loading && !analytics && <p className="text-sm text-slate-500">Loading ERP feed…</p>}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card>
      <CardBody>
        <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
        <p className={`mt-1 text-2xl font-bold tabular-nums ${accent ? "text-red-600" : "text-slate-900"}`}>
          {value}
        </p>
      </CardBody>
    </Card>
  );
}
