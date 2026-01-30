"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { FiltersBar } from "@/components/filters/FiltersBar";
import { StageDurationChart } from "@/components/charts/StageDurationChart";
import { FunnelChart } from "@/components/charts/FunnelChart";
import { DropoffHeatmap } from "@/components/charts/DropoffHeatmap";
import { DriversChart } from "@/components/charts/DriversChart";
import { InsightCards } from "@/components/insights/InsightCards";
import { DataTable } from "@/components/table/DataTable";

import { computeStageAggregates, computeCycleStats } from "@/lib/analytics/rollups";
import { computeDropoffs, computeFunnel } from "@/lib/analytics/funnel";
import { generateInsights } from "@/lib/analytics/insights";

import { SAMPLE_CSV_PATH, SYNTHETIC_DISCLAIMER } from "@/lib/constants";
import { buildDatasetFromCsvText, fetchCsvText } from "@/lib/loadDataset";
import { useExplorerStore } from "@/store/useExplorerStore";
import type { DealRollup } from "@/lib/analytics/rollups";

function KpiCard(props: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium text-slate-600">{props.label}</div>
      <div className="mt-1 text-lg font-semibold tracking-tight text-slate-900">{props.value}</div>
      {props.sub ? <div className="mt-1 text-xs text-slate-500">{props.sub}</div> : null}
    </div>
  );
}

function FilterChip(props: { label: string; onClear: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClear}
      className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-medium text-brand-900 shadow-sm transition hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2"
      title="Click to clear filter"
    >
      {props.label}
      <span className="text-slate-400">×</span>
    </button>
  );
}

function LoadingState() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <p className="mt-2 text-sm text-slate-700">Loading the bundled sample dataset…</p>
        </div>
        <div className="h-5 w-24 animate-pulse rounded-full bg-slate-100" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="h-20 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
        <div className="h-20 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
        <div className="h-20 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
      </div>

      <div className="mt-4 h-64 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
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

  const activeChips: Array<{ key: string; label: string; clear: () => void }> = [
    filters.segment !== "All"
      ? { key: "segment", label: `Segment: ${filters.segment}`, clear: () => actions.setFilters({ segment: "All" }) }
      : null,
    filters.region !== "All"
      ? { key: "region", label: `Region: ${filters.region}`, clear: () => actions.setFilters({ region: "All" }) }
      : null,
    filters.sellerTenureBucket !== "All"
      ? {
          key: "tenure",
          label: `Tenure: ${filters.sellerTenureBucket}`,
          clear: () => actions.setFilters({ sellerTenureBucket: "All" })
        }
      : null,
    filters.outcome !== "All"
      ? { key: "outcome", label: `Outcome: ${filters.outcome}`, clear: () => actions.setFilters({ outcome: "All" }) }
      : null
  ].filter(Boolean) as any;

  return (
    <div className="space-y-4">
      {source === "sample" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
          <span className="font-semibold">{SYNTHETIC_DISCLAIMER.split(":")[0]}:</span>{" "}
          {SYNTHETIC_DISCLAIMER.split(":").slice(1).join(":").trim()}
        </div>
      ) : null}

      {loadError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 shadow-sm">
          <div className="font-semibold">Data load error</div>
          <div className="mt-1">{loadError}</div>
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-lg font-semibold">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">
              Interactive funnel explorer (filters apply everywhere).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {activeChips.length ? (
              <>
                {activeChips.map((c: any) => (
                  <FilterChip key={c.key} label={c.label} onClear={c.clear} />
                ))}
                <button
                  type="button"
                  onClick={() =>
                    actions.setFilters({
                      segment: "All",
                      region: "All",
                      sellerTenureBucket: "All",
                      outcome: "All"
                    })
                  }
                  className="rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2"
                >
                  Reset
                </button>
              </>
            ) : (
              <span className="text-sm text-slate-600">No filters applied</span>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <KpiCard label="Deals in view" value={`${filteredDeals.length}`} sub={`Stage rows: ${filteredStageRows.length}`} />
          <KpiCard label="Win rate" value={`${(cycleStats.winRate * 100).toFixed(1)}%`} sub={`n=${cycleStats.nDeals}`} />
          <KpiCard
            label="Median cycle time"
            value={`${cycleStats.medianTotalCycleTime.toFixed(1)}d`}
            sub={`Avg: ${cycleStats.avgTotalCycleTime.toFixed(1)}d`}
          />
        </div>
      </div>

      {parseSummary ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-700">
            <span>
              <span className="font-medium text-slate-900">Stage rows:</span> {stageRows.length}
            </span>
            <span>
              <span className="font-medium text-slate-900">Deals:</span> {deals.length}
            </span>
            <span>
              <span className="font-medium text-slate-900">Dropped rows:</span> {parseSummary.droppedRowCount}
            </span>
            {parseSummary.papaErrors.length ? (
              <span className="text-rose-700">
                <span className="font-medium">CSV parse warnings:</span> {parseSummary.papaErrors.length}
              </span>
            ) : null}
          </div>

          {parseSummary.invalidRowsPreview.length ? (
            <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <summary className="cursor-pointer text-sm font-medium text-slate-800">
                Show first {parseSummary.invalidRowsPreview.length} invalid rows
              </summary>
              <div className="mt-3 space-y-3 text-sm text-slate-700">
                {parseSummary.invalidRowsPreview.map((r) => (
                  <div key={r.rowNumber} className="rounded-md border border-slate-200 bg-white p-3">
                    <div className="font-medium text-slate-900">Row {r.rowNumber}</div>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {r.issues.map((i) => (
                        <li key={i}>{i}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </details>
          ) : null}
        </div>
      ) : null}

      <FiltersBar />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StageDurationChart stageAggs={stageAggs} cycleStats={cycleStats} />
        <div className="grid grid-cols-1 gap-4">
          <FunnelChart funnel={funnel} />
          <DropoffHeatmap
            dropoffs={dropoffs}
            worstTransitionLabel={worstDropoff ? `${worstDropoff.from}→${worstDropoff.to}` : undefined}
            segmentBreakdown={dropoffSegmentBreakdown}
            regionBreakdown={dropoffRegionBreakdown}
          />
        </div>
      </div>

      <DriversChart status={modelStatus} result={modelResult} />
      <InsightCards insights={insights} />

      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-slate-700">Data table</div>
        <button
          type="button"
          onClick={() => setHideTable((v) => !v)}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-brand-200 hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2"
        >
          {hideTable ? "Show table" : "Hide table"}
        </button>
      </div>

      {hideTable ? null : <DataTable rows={filteredStageRows} />}
    </div>
  );
}

