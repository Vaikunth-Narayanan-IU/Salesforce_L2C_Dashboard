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
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div>
        <h2 className="text-base font-semibold">Drop-off heatmap</h2>
        <p className="mt-1 text-sm text-slate-600">
          Transition drop-off % (hover for counts).
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {props.dropoffs.map((d) => {
          const level = bucket(d.dropPct);
          const dropPct = d.dropPct * 100;
          return (
            <div
              key={`${d.from}-${d.to}`}
              className={[
                "rounded-md border px-3 py-3 shadow-sm",
                "transition-colors",
                cellClass(level)
              ].join(" ")}
              title={`${d.from}→${d.to}: drop-off ${dropPct.toFixed(1)}% (from n=${d.fromCount} to n=${d.toCount})`}
            >
              <div className="text-xs font-medium opacity-80">{d.from}→{d.to}</div>
              <div className="mt-1 text-lg font-semibold">{dropPct.toFixed(1)}%</div>
              <div className="mt-1 text-xs opacity-80">
                n={d.fromCount} → {d.toCount}
              </div>
            </div>
          );
        })}
      </div>

      {(props.segmentBreakdown?.length || props.regionBreakdown?.length) ? (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {props.segmentBreakdown?.length ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="text-sm font-medium text-slate-900">By segment</div>
              <div className="mt-1 text-xs text-slate-600">
                Worst transition: {props.worstTransitionLabel ?? "—"}
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {props.segmentBreakdown.map((r) => (
                  <li key={r.group} className="flex items-center justify-between gap-3">
                    <span className="truncate text-slate-700">{r.group}</span>
                    <span className="whitespace-nowrap font-medium text-slate-900">
                      {(r.dropPct * 100).toFixed(1)}% <span className="text-xs text-slate-500">(n={r.fromCount}→{r.toCount})</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {props.regionBreakdown?.length ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="text-sm font-medium text-slate-900">By region</div>
              <div className="mt-1 text-xs text-slate-600">
                Worst transition: {props.worstTransitionLabel ?? "—"}
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {props.regionBreakdown.map((r) => (
                  <li key={r.group} className="flex items-center justify-between gap-3">
                    <span className="truncate text-slate-700">{r.group}</span>
                    <span className="whitespace-nowrap font-medium text-slate-900">
                      {(r.dropPct * 100).toFixed(1)}% <span className="text-xs text-slate-500">(n={r.fromCount}→{r.toCount})</span>
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

