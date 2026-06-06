"use client";

import { useCallback, useEffect, useState } from "react";
import type { Analytics, Dataset } from "./types";
import { computeAnalytics } from "./analytics";

export interface DatasetState {
  seed: number;
  dataset: Dataset | null;
  analytics: Analytics | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

// Fetches the mock ERP feed for the current seed and derives analytics in the
// browser, so "reload" produces a visibly different dataset + tables.
export function useDataset(): DatasetState {
  const [seed, setSeed] = useState(1);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/erp?seed=${seed}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`ERP feed returned ${r.status}`);
        return r.json();
      })
      .then((ds: Dataset) => {
        if (cancelled) return;
        setDataset(ds);
        setAnalytics(computeAnalytics(ds));
        setError(null);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [seed]);

  const reload = useCallback(() => setSeed((s) => s + 1), []);

  return { seed, dataset, analytics, loading, error, reload };
}
