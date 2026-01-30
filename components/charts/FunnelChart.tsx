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
        <h2 className="text-base font-semibold">Funnel conversion</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode("pct")}
            className={[
              "rounded-full px-3 py-1.5 text-xs font-semibold transition",
              mode === "pct"
                ? "bg-brand-600 text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:bg-brand-50"
            ].join(" ")}
          >
            Percent
          </button>
          <button
            type="button"
            onClick={() => setMode("count")}
            className={[
              "rounded-full px-3 py-1.5 text-xs font-semibold transition",
              mode === "count"
                ? "bg-brand-600 text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:bg-brand-50"
            ].join(" ")}
          >
            Count
          </button>
        </div>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        {mode === "pct" ? "Percent of deals reaching each stage." : "Deal counts reaching each stage."}
      </p>

      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
            {mode === "pct" ? (
              <YAxis
                tick={{ fontSize: 12 }}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
            ) : (
              <YAxis tick={{ fontSize: 12 }} />
            )}
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0]?.payload as (typeof data)[number];
                return (
                  <div className="rounded-md border border-slate-200 bg-white p-3 text-xs shadow-sm">
                    <div className="font-semibold text-slate-900">{label}</div>
                    <div className="mt-1 text-slate-700">
                      Reached:{" "}
                      <span className="font-medium">
                        {mode === "pct" ? `${p.reachedPct}%` : `${p.reachedCount}`}
                      </span>
                    </div>
                    <div className="text-slate-500">n={p.reachedCount}</div>
                  </div>
                );
              }}
            />
            <Bar
              dataKey={mode === "pct" ? "reachedPct" : "reachedCount"}
              fill="#0089C3"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

