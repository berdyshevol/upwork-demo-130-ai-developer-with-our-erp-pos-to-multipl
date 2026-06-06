import type { ForecastPoint } from "@/lib/types";

// Lightweight dependency-free SVG bar chart for the 7-day forecast horizon.
export function ForecastChart({ points }: { points: ForecastPoint[] }) {
  const max = Math.max(1, ...points.map((p) => p.predictedQty));

  return (
    <div data-testid="forecast-chart" className="w-full">
      <div className="flex items-end gap-3" style={{ height: 200 }}>
        {points.map((p) => {
          const pct = Math.max(6, Math.round((p.predictedQty / max) * 100));
          const label = new Date(p.date + "T00:00:00Z").toLocaleDateString("en-US", {
            weekday: "short",
            timeZone: "UTC",
          });
          return (
            <div key={p.date} data-testid="forecast-bar" className="flex flex-1 flex-col items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">{p.predictedQty}</span>
              <div className="flex w-full items-end" style={{ height: 140 }}>
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-brand-700 to-brand-600"
                  style={{ height: `${pct}%` }}
                  title={`${p.date}: ${p.predictedQty} units (conf ${Math.round(p.confidence * 100)}%)`}
                />
              </div>
              <span className="text-xs text-slate-500">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
