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

import type { CycleStats, StageAgg } from "@/lib/analytics/rollups";

function fmtDays(v: number) {
  return `${v.toFixed(1)}d`;
}

function TogglePill(props: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={[
        "rounded-full px-3 py-1.5 text-xs font-semibold transition",
        props.active
          ? "bg-brand-600 text-white"
          : "border border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:bg-brand-50"
      ].join(" ")}
    >
      {props.label}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-xs font-medium text-slate-600">{label}</div>
      <div className="text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

export function StageDurationChart(props: { stageAggs: StageAgg[]; cycleStats: CycleStats }) {
  const [metric, setMetric] = useState<"avg" | "median" | "p75">("avg");

  const data = useMemo(
    () =>
      props.stageAggs.map((s) => ({
        stage: s.stage,
        avg: s.avg,
        median: s.median,
        p75: s.p75,
        n: s.n
      })),
    [props.stageAggs]
  );

  const metricLabel = metric === "avg" ? "Avg" : metric === "median" ? "Median" : "P75";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Stage Duration Distribution</h2>
          <p className="mt-1 text-sm text-slate-500">
            Average time deals spend in each L2O stage
          </p>
        </div>

        <div className="flex items-center gap-2">
          <TogglePill active={metric === "avg"} label="Avg" onClick={() => setMetric("avg")} />
          <TogglePill active={metric === "median"} label="Median" onClick={() => setMetric("median")} />
          <TogglePill active={metric === "p75"} label="P75" onClick={() => setMetric("p75")} />
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
              <YAxis
                tick={{ fontSize: 11, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}d`}
              />
              <Tooltip
                cursor={{ fill: "#F1F5F9" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0]?.payload as (typeof data)[number];
                  return (
                    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg ring-1 ring-black/5">
                      <div className="font-semibold text-slate-900">{label}</div>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between gap-4 text-sm">
                          <span className="text-slate-600">Average:</span>
                          <span className="font-medium text-slate-900">{fmtDays(p.avg)}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-sm">
                          <span className="text-slate-600">Median:</span>
                          <span className="font-medium text-slate-900">{fmtDays(p.median)}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-sm">
                          <span className="text-slate-600">P75:</span>
                          <span className="font-medium text-slate-900">{fmtDays(p.p75)}</span>
                        </div>
                      </div>
                      <div className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-400">
                        Based on {p.n} deals
                      </div>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey={metric}
                name={metricLabel}
                fill="#00A1E0"
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

