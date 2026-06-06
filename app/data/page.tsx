"use client";

import { useDataset } from "@/lib/use-dataset";
import { Card, CardHeader, CardBody, Button, ClassBadge } from "@/components/ui";

export default function DataPage() {
  const { seed, dataset, analytics, loading, reload } = useDataset();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sample dataset</h1>
          <p className="mt-1 text-sm text-slate-500">
            Served from the mock ERP endpoint{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">/api/erp?seed={seed}</code>.{" "}
            <span data-testid="dataset-version" className="font-medium text-slate-700">Dataset #{seed}</span>
          </p>
        </div>
        <Button testId="reload-data" variant="outline" onClick={reload}>
          ↻ Reload dataset
        </Button>
      </div>

      <Card testId="data-table">
        <CardHeader
          title="Per-SKU rollup"
          subtitle="30 days of sales aggregated per product, straight from the ERP feed"
        />
        <CardBody className="overflow-x-auto">
          {loading && !analytics ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-3">ID</th>
                  <th className="py-2 pr-3">Product</th>
                  <th className="py-2 pr-3">Category</th>
                  <th className="py-2 pr-3 text-right">Unit $</th>
                  <th className="py-2 pr-3 text-right">Units (30d)</th>
                  <th className="py-2 pr-3 text-right">Revenue</th>
                  <th className="py-2 text-right">Class</th>
                </tr>
              </thead>
              <tbody>
                {analytics?.perProduct.map((p) => (
                  <tr key={p.product.id} data-testid="data-row" className="border-b border-slate-50">
                    <td className="py-2 pr-3 font-mono text-xs text-slate-500">{p.product.id}</td>
                    <td className="py-2 pr-3 font-medium text-slate-800">{p.product.name}</td>
                    <td className="py-2 pr-3 text-slate-600">{p.product.category}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">${p.product.unitPrice}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{p.totalUnits}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">${p.totalRevenue}</td>
                    <td className="py-2 text-right"><ClassBadge value={p.abcClass} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {dataset && (
        <p className="text-xs text-slate-400">
          {dataset.sales.length} raw sales records across {dataset.products.length} SKUs ·{" "}
          {dataset.inventory.length} inventory levels.
        </p>
      )}
    </div>
  );
}
