"use client";

import type { DropoffPoint } from "@/lib/analytics/funnel";

export type DropoffBreakdownRow = {
  group: string;
  dropPct: number; // 0..1
  fromCount: number;
  toCount: number;
};

function bucket(dropPct: number): number {
  // 0..1 -> 0..4
  if (dropPct <= 0.05) return 0;
  if (dropPct <= 0.12) return 1;
  if (dropPct <= 0.2) return 2;
  if (dropPct <= 0.3) return 3;
  return 4;
}

function cellClass(level: number): string {
  // Tailwind intensity scale (CSS-class based; avoids hard-coded hex).
  const map: Record<number, string> = {
    0: "bg-emerald-50 text-emerald-900 border-emerald-100",
    1: "bg-amber-50 text-amber-900 border-amber-100",
    2: "bg-orange-50 text-orange-900 border-orange-100",
    3: "bg-red-50 text-red-900 border-red-100",
    4: "bg-red-100 text-red-900 border-red-200"
  };
  return map[level] ?? map[0]!;
}

export function DropoffHeatmap(props: {
  dropoffs: DropoffPoint[];
  worstTransitionLabel?: string;
  segmentBreakdown?: DropoffBreakdownRow[];
  regionBreakdown?: DropoffBreakdownRow[];
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-slate-900">Funnel Drop-off</h2>
        <p className="mt-1 text-sm text-slate-500">
          Heatmap of deal loss between stages (hover for details)
        </p>
      </div>

      {props.dropoffs.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
          <p className="text-sm text-slate-500">No data matches the selected filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {props.dropoffs.map((d) => {
            const level = bucket(d.dropPct);
            const dropPct = d.dropPct * 100;
            return (
              <div
                key={`${d.from}-${d.to}`}
                className={[
                  "flex flex-col justify-between rounded-lg border p-4 transition-colors hover:shadow-md",
                  cellClass(level)
                ].join(" ")}
                title={`${d.from} → ${d.to}\nDrop-off: ${dropPct.toFixed(1)}%\n${d.fromCount} entered → ${d.toCount} progressed`}
              >
                <div className="text-xs font-medium uppercase opacity-70">
                  {d.from} → {d.to}
                </div>
                <div className="mt-2 text-2xl font-bold tracking-tight">
                  {dropPct.toFixed(1)}%
                </div>
                <div className="mt-1 text-xs opacity-70">
                  {d.fromCount} → {d.toCount}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(props.segmentBreakdown?.length || props.regionBreakdown?.length) ? (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {props.segmentBreakdown?.length ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">Highest Drop-off by Segment</div>
              <div className="mt-1 text-xs text-slate-500">
                Top segments for transition: {props.worstTransitionLabel ?? "—"}
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {props.segmentBreakdown.map((r) => (
                  <li key={r.group} className="flex items-center justify-between gap-3 border-b border-slate-200 pb-1 last:border-0 last:pb-0">
                    <span className="truncate font-medium text-slate-700">{r.group}</span>
                    <span className="whitespace-nowrap text-slate-900">
                      {(r.dropPct * 100).toFixed(1)}% <span className="text-xs text-slate-400">({r.fromCount}→{r.toCount})</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {props.regionBreakdown?.length ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">Highest Drop-off by Region</div>
              <div className="mt-1 text-xs text-slate-500">
                Top regions for transition: {props.worstTransitionLabel ?? "—"}
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {props.regionBreakdown.map((r) => (
                  <li key={r.group} className="flex items-center justify-between gap-3 border-b border-slate-200 pb-1 last:border-0 last:pb-0">
                    <span className="truncate font-medium text-slate-700">{r.group}</span>
                    <span className="whitespace-nowrap text-slate-900">
                      {(r.dropPct * 100).toFixed(1)}% <span className="text-xs text-slate-400">({r.fromCount}→{r.toCount})</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

