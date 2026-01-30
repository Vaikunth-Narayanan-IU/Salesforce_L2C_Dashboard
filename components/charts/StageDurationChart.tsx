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
          <h2 className="text-base font-semibold">Stage Duration Analysis</h2>
          <p className="mt-1 text-sm text-slate-600">
            Toggle the bar metric; tooltip shows avg/median/p75.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <TogglePill active={metric === "avg"} label="Avg" onClick={() => setMetric("avg")} />
          <TogglePill active={metric === "median"} label="Median" onClick={() => setMetric("median")} />
          <TogglePill active={metric === "p75"} label="P75" onClick={() => setMetric("p75")} />
        </div>
      </div>

      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0]?.payload as (typeof data)[number];
                return (
                  <div className="rounded-md border border-slate-200 bg-white p-3 text-xs shadow-sm">
                    <div className="font-semibold text-slate-900">{label}</div>
                    <div className="mt-1 text-slate-700">
                      Avg: <span className="font-medium">{fmtDays(p.avg)}</span>
                    </div>
                    <div className="text-slate-700">
                      Median: <span className="font-medium">{fmtDays(p.median)}</span>
                    </div>
                    <div className="text-slate-700">
                      P75: <span className="font-medium">{fmtDays(p.p75)}</span>
                    </div>
                    <div className="mt-1 text-slate-500">n={p.n}</div>
                  </div>
                );
              }}
            />
            <Bar dataKey={metric} name={metricLabel} fill="#00A1E0" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Avg total cycle time" value={fmtDays(props.cycleStats.avgTotalCycleTime)} />
        <Stat
          label="Median cycle time"
          value={fmtDays(props.cycleStats.medianTotalCycleTime)}
        />
        <Stat label="Win rate" value={`${(props.cycleStats.winRate * 100).toFixed(1)}%`} />
      </div>
    </div>
  );
}

