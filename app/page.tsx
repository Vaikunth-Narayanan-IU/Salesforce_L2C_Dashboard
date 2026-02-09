"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { FiltersBar } from "@/components/filters/FiltersBar";
import { StageDurationChart } from "@/components/charts/StageDurationChart";
import { FunnelChart } from "@/components/charts/FunnelChart";
import { DropoffHeatmap } from "@/components/charts/DropoffHeatmap";
import { DriversChart } from "@/components/charts/DriversChart";
import { InsightCards } from "@/components/insights/InsightCards";
import { DataTable } from "@/components/table/DataTable";
import { KpiRow } from "@/components/stats/KpiRow";

import { computeStageAggregates, computeCycleStats } from "@/lib/analytics/rollups";
import { computeDropoffs, computeFunnel } from "@/lib/analytics/funnel";
import { generateInsights } from "@/lib/analytics/insights";

import { SAMPLE_CSV_PATH, SYNTHETIC_DISCLAIMER } from "@/lib/constants";
import { buildDatasetFromCsvText, fetchCsvText } from "@/lib/loadDataset";
import { useExplorerStore } from "@/store/useExplorerStore";
import type { DealRollup } from "@/lib/analytics/rollups";

function LoadingState() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse space-y-8 p-6">
      <div className="h-10 w-1/3 rounded bg-slate-200"></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="h-32 rounded bg-slate-200"></div>
        <div className="h-32 rounded bg-slate-200"></div>
        <div className="h-32 rounded bg-slate-200"></div>
        <div className="h-32 rounded bg-slate-200"></div>
      </div>
      <div className="h-96 rounded bg-slate-200"></div>
    </div>
  );
}

export default function DashboardPage() {
  const source = useExplorerStore((s) => s.source);
  const stageRows = useExplorerStore((s) => s.stageRows);
  const deals = useExplorerStore((s) => s.deals);
  const filters = useExplorerStore((s) => s.filters);
  const availableSegments = useExplorerStore((s) => s.availableSegments);
  const availableRegions = useExplorerStore((s) => s.availableRegions);
  const parseSummary = useExplorerStore((s) => s.parseSummary);
  const loadError = useExplorerStore((s) => s.loadError);

  const modelStatus = useExplorerStore((s) => s.modelStatus);
  const modelResult = useExplorerStore((s) => s.modelResult);
  const actions = useExplorerStore((s) => s.actions);

  const [hideTable, setHideTable] = useState(false);

  // Auto-load the bundled CSV so visuals appear immediately.
  const didAutoLoadRef = useRef(false);
  useEffect(() => {
    if (didAutoLoadRef.current) return;
    if (source !== "none") return;

    didAutoLoadRef.current = true;
    (async () => {
      actions.setLoadError(null);
      const fetched = await fetchCsvText(SAMPLE_CSV_PATH);
      if (!fetched.ok) return actions.setLoadError(fetched.error);
      const built = buildDatasetFromCsvText(fetched.csvText);
      if (!built.ok) return actions.setLoadError(built.error);

      actions.loadData({
        source: "sample",
        stageRows: built.dataset.stageRows,
        deals: built.dataset.deals,
        parseSummary: built.dataset.parseSummary,
        availableSegments: built.dataset.availableSegments,
        availableRegions: built.dataset.availableRegions
      });
    })();
  }, [actions, source]);

  const filteredDeals = useMemo(() => {
    let out: DealRollup[] = deals;
    if (filters.segment !== "All") out = out.filter((d) => d.segment === filters.segment);
    if (filters.region !== "All") out = out.filter((d) => d.region === filters.region);
    if (filters.sellerTenureBucket !== "All")
      out = out.filter((d) => d.seller_tenure_bucket === filters.sellerTenureBucket);
    if (filters.outcome !== "All") out = out.filter((d) => d.outcome === filters.outcome);
    return out;
  }, [deals, filters]);

  const filteredDealIdSet = useMemo(() => new Set(filteredDeals.map((d) => d.deal_id)), [filteredDeals]);

  const filteredStageRows = useMemo(
    () => stageRows.filter((r) => filteredDealIdSet.has(r.deal_id)),
    [stageRows, filteredDealIdSet]
  );

  const stageAggs = useMemo(() => computeStageAggregates(filteredStageRows), [filteredStageRows]);
  const cycleStats = useMemo(() => computeCycleStats(filteredDeals), [filteredDeals]);
  const funnel = useMemo(() => computeFunnel(filteredDeals), [filteredDeals]);
  const dropoffs = useMemo(() => computeDropoffs(filteredDeals), [filteredDeals]);

  const worstDropoff = useMemo(() => {
    return dropoffs
      .slice()
      .sort((a, b) => b.dropPct - a.dropPct)
      .find((d) => d.fromCount > 0) ?? null;
  }, [dropoffs]);

  const dropoffSegmentBreakdown = useMemo(() => {
    if (!worstDropoff) return [];
    const groups = Array.from(new Set(filteredDeals.map((d) => d.segment)));
    return groups
      .map((g) => {
        const ds = filteredDeals.filter((d) => d.segment === g);
        const fromCount = ds.filter((d) => d.reached_stage_max >= worstDropoff.fromOrder).length;
        const toCount = ds.filter((d) => d.reached_stage_max >= worstDropoff.toOrder).length;
        const dropPct = fromCount ? Math.max(0, (fromCount - toCount) / fromCount) : 0;
        return { group: g, dropPct, fromCount, toCount };
      })
      .filter((r) => r.fromCount >= 20)
      .sort((a, b) => b.dropPct - a.dropPct)
      .slice(0, 6);
  }, [filteredDeals, worstDropoff]);

  const dropoffRegionBreakdown = useMemo(() => {
    if (!worstDropoff) return [];
    const groups = Array.from(new Set(filteredDeals.map((d) => d.region)));
    return groups
      .map((g) => {
        const ds = filteredDeals.filter((d) => d.region === g);
        const fromCount = ds.filter((d) => d.reached_stage_max >= worstDropoff.fromOrder).length;
        const toCount = ds.filter((d) => d.reached_stage_max >= worstDropoff.toOrder).length;
        const dropPct = fromCount ? Math.max(0, (fromCount - toCount) / fromCount) : 0;
        return { group: g, dropPct, fromCount, toCount };
      })
      .filter((r) => r.fromCount >= 20)
      .sort((a, b) => b.dropPct - a.dropPct)
      .slice(0, 6);
  }, [filteredDeals, worstDropoff]);

  const insights = useMemo(
    () =>
      generateInsights({
        deals: filteredDeals,
        stageAggs,
        funnel,
        dropoffs
      }),
    [filteredDeals, stageAggs, funnel, dropoffs]
  );

  // Train model in a web worker, debounced by 300ms.
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL("../workers/analytics.worker.ts", import.meta.url));
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<any>) => {
      const msg = e.data;
      if (msg?.type === "modelResult") {
        actions.setModelResult(msg.result);
      } else if (msg?.type === "error") {
        actions.setModelError(msg.message ?? "Worker error");
      }
    };

    worker.onerror = (e) => {
      actions.setModelError(e.message ?? "Worker error");
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [actions]);

  useEffect(() => {
    if (!workerRef.current) return;
    if (filteredDeals.length === 0) return;

    actions.setModelTraining();
    const t = window.setTimeout(() => {
      workerRef.current?.postMessage({
        type: "trainModel",
        deals: filteredDeals,
        categories: { segments: availableSegments, regions: availableRegions }
      });
    }, 300);

    return () => window.clearTimeout(t);
  }, [filteredDeals, availableSegments, availableRegions, actions]);

  if (source === "none") {
    return <LoadingState />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 font-sans text-slate-900">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          L2O Funnel Friction Explorer
        </h1>
        <p className="text-lg text-slate-600">
          Explore where deals slow down in the Lead-to-Cash funnel and what drives friction.
        </p>
      </header>

      {/* Funnel Health Overview */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          Funnel Health Overview
        </h2>
        <KpiRow
          filteredDealsCount={filteredDeals.length}
          filteredStageRowsCount={filteredStageRows.length}
          cycleStats={cycleStats}
          worstDropoff={worstDropoff}
        />
      </section>

      {/* Filters */}
      <section>
        <FiltersBar />
      </section>

      {/* Where Deals Stall */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          Where Deals Stall
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <StageDurationChart stageAggs={stageAggs} cycleStats={cycleStats} />
          <FunnelChart funnel={funnel} />
        </div>
        <DropoffHeatmap
          dropoffs={dropoffs}
          worstTransitionLabel={worstDropoff ? `${worstDropoff.from}→${worstDropoff.to}` : undefined}
          segmentBreakdown={dropoffSegmentBreakdown}
          regionBreakdown={dropoffRegionBreakdown}
        />
      </section>

      {/* Primary Friction Drivers */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          Primary Friction Drivers
        </h2>
        <DriversChart status={modelStatus} result={modelResult} />
      </section>

      {/* Key Insights */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          Key Insights
        </h2>
        <InsightCards insights={insights} />
      </section>

      {/* Parse Summary (if any issues) */}
      {parseSummary && (parseSummary.droppedRowCount > 0 || parseSummary.papaErrors.length > 0) ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-amber-900">
            <span className="font-semibold">Data Quality Note:</span>
            <span>
              <span className="font-medium">Dropped rows:</span> {parseSummary.droppedRowCount}
            </span>
            {parseSummary.papaErrors.length ? (
              <span>
                <span className="font-medium">CSV parse warnings:</span> {parseSummary.papaErrors.length}
              </span>
            ) : null}
          </div>
          {parseSummary.invalidRowsPreview.length ? (
            <details className="mt-2 text-sm text-amber-800">
              <summary className="cursor-pointer font-medium hover:underline">
                View invalid rows ({parseSummary.invalidRowsPreview.length})
              </summary>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {parseSummary.invalidRowsPreview.map((r, i) => (
                  <li key={i}>Row {r.rowNumber}: {r.issues.join(", ")}</li>
                ))}
              </ul>
            </details>
          ) : null}
        </section>
      ) : null}

      {/* Data Table & Footer */}
      <section className="border-t border-slate-200 pt-8">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-slate-700">Detailed Data View</div>
          <button
            type="button"
            onClick={() => setHideTable((v) => !v)}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-brand-200 hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2"
          >
            {hideTable ? "Show table" : "Hide table"}
          </button>
        </div>
        {!hideTable && <div className="mt-4"><DataTable rows={filteredStageRows} /></div>}

        <div className="mt-8 text-center text-sm text-slate-500">
          Insights generated from synthetic demo data • {SYNTHETIC_DISCLAIMER.split(":").slice(1).join(":").trim()}
        </div>
      </section>
    </div>
  );
}

