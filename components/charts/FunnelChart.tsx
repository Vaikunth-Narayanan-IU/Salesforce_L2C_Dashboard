"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { FunnelPoint } from "@/lib/analytics/funnel";

export function FunnelChart(props: { funnel: FunnelPoint[] }) {
  const [mode, setMode] = useState<"pct" | "count">("pct");
  const data = useMemo(
    () =>
      props.funnel.map((p) => ({
        stage: p.stage,
        reachedPct: Math.round(p.reachedPct * 1000) / 10, // one decimal
        reachedCount: p.reachedCount
      })),
    [props.funnel]
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Funnel Conversion</h2>
          <p className="mt-1 text-sm text-slate-500">
            Percentage of deals that progress to each stage
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode("pct")}
            className={[
              "rounded-full px-3 py-1.5 text-xs font-medium transition",
              mode === "pct"
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            ].join(" ")}
          >
            Percent
          </button>
          <button
            type="button"
            onClick={() => setMode("count")}
            className={[
              "rounded-full px-3 py-1.5 text-xs font-medium transition",
              mode === "count"
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            ].join(" ")}
          >
            Count
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="mt-10 flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
          <p className="text-sm text-slate-500">No data matches the selected filters</p>
        </div>
      ) : (
        <div className="mt-6 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="stage"
                tick={{ fontSize: 11, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              {mode === "pct" ? (
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  axisLine={false}
                  tickLine={false}
                />
              ) : (
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                />
              )}
              <Tooltip
                cursor={{ fill: "#F1F5F9" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0]?.payload as (typeof data)[number];
                  return (
                    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg ring-1 ring-black/5">
                      <div className="font-semibold text-slate-900">{label}</div>
                      <div className="mt-1 flex items-baseline gap-2 text-sm text-slate-600">
                        <span>Reached:</span>
                        <span className="font-medium text-brand-600">
                          {mode === "pct" ? `${p.reachedPct}%` : `${p.reachedCount}`}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">Base n={p.reachedCount}</div>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey={mode === "pct" ? "reachedPct" : "reachedCount"}
                fill="#0ea5e9" // Sky-500
                radius={[4, 4, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

